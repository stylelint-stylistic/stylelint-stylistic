/**
 * Lints one text under one or more rules of this plugin the way Stylelint would, without Stylelint.
 *
 * A call of `stylelint.lint` over a snippet costs about 0.8 ms on this machine, and 0.7 of them are the linter around the rule — a linter created for the call, a configuration searched for and augmented, an ignore file looked up, reference roots loaded, disable comments walked. The parse and the rule cost 0.05 ms together. An oracle or a sweep makes hundreds of thousands of such calls over snippets that carry no configuration comment and no ignore file, so the runner here does what `lintPostcssResult.mjs` does for one rule and nothing of the rest: it parses, hangs the `stylelint` object `report()` and `validateOptions` read on the result, calls the rule, and hands back what the rule said and what it wrote. `verify-lint.ts` is the proof that the two agree, run over every run the oracles make.
 *
 * What is not reproduced, since no corpus of this repository carries it: disable comments and their ranges, `ignoreDisables`, `quiet`, `computeEditInfo`, the lexer and the reference roots. A rule reaching for one of them would show up in the verification as a disagreement rather than as a wrong answer.
 */

import { existsSync } from "node:fs"
import { EOL } from "node:os"
import path from "node:path"

import postcss, { type Document, type Root, type Syntax, type Warning as PostcssWarning } from "postcss"
import type { PostcssResult, Rule, RuleMeta, RuleSeverity, StylelintPostcssResult } from "stylelint"

import type { Syntax as RuleSyntax } from "../../lib/syntaxes/index.ts"

import { BREAK_AS_STYLELINT_READS_IT } from "./regexps.ts"

/** The comment word Stylelint reads its configuration comments by, which no fixture carries and which a rule may still ask about. */
const CONFIGURATION_COMMENT = `stylelint`

/** The namespace segment of a rule name, `less/` in `@stylistic/less/color-hex-case` and in the `(@stylistic/less/color-hex-case)` a message closes with. */
const EVERY_NAMESPACE_SEGMENT = /(?<=@stylistic\/)[a-z]+\//gu

/** The namespace segment at the head of a registry key, `less/` in `less/color-hex-case`. */
const LEADING_NAMESPACE_SEGMENT = /^[a-z]+\//u

/** The severity every rule is given, since a run here has no configuration to set another. */
const SEVERITY = `error`

/** What a rule said, in the fields the oracles read; the warning standing in for a parse error carries no position. */
export type Warning = {
	rule?: string | undefined,
	text: string,
	line?: number | undefined,
	column?: number | undefined,
	endLine?: number | undefined,
	endColumn?: number | undefined,
	severity?: string | undefined,
}

/** A rule by its short name, with its primary option and, where there is one, its secondary options. */
export type RuleSetting = [string, unknown, (object | undefined)?]

/** The rules of one checkout by the names a configuration spells them with behind `@stylistic/`: the short name for a rule of the core, `scss/<name>` and the like for one registered under a syntax's namespace. */
export type Registry = Record<string, Rule>

/** What `lib/rules/index.ts` exports: a factory per rule, or — in a checkout from before the factories — the rule itself. */
type Exported = Rule | ((syntax: RuleSyntax) => Rule)

/** What the rules said and wrote, or why the text could not be read. `invalidOptions` holds what the rules objected to about their options, in the words `validateOptions` wrote them in, so that a run standing on an option no rule takes is told apart from one over which the rules had nothing to say — and told which option of which rule was refused. */
export type Answer = {
	unparsable: true,
	detail: string,
} | {
	unparsable: false,
	invalidOptions: string[],
	warnings: Warning[],
	code: string,
}

/** The configuration `runs.ts` builds: a plugin named by its path, a syntax named by its package, and the rules under their namespaced names. */
export type Config = {
	plugins: string[],
	customSyntax?: string,
	rules: Record<string, unknown>,
}

/** The syntaxes a run can name, each loaded once on first use. */
let syntaxes: Map<string, Syntax> = new Map()

/**
 * Loads a syntax by the name a configuration spells it with, or hands back the one given.
 * @param syntax - A package name such as `postcss-scss`, a syntax object, or nothing for plain CSS.
 * @returns The syntax to parse and print with.
 */
async function loadSyntax (syntax: string | Syntax | undefined): Promise<Syntax> {
	if (!syntax) return postcss
	if (typeof syntax !== `string`) return syntax

	let known = syntaxes.get(syntax)

	if (known) return known

	let module = await import(syntax)
	let loaded = module.default ?? module

	syntaxes.set(syntax, loaded)

	return loaded
}

/**
 * Builds the registry out of what `lib/rules/index.ts` exports: every factory called once for the core and once per syntax registered beside it, each result filed under the name a configuration spells it with.
 *
 * A checkout from before the factories exports the rules themselves, each already carrying its name, and such an entry is filed as it is: a base is measured through the branch's harness, so the harness reads both shapes until every base a comparison can name has the factories.
 * @param rules - The default export of a checkout's `lib/rules/index.ts`.
 * @param adapters - The core's syntax first, then every namespace's; none for a checkout without them.
 * @returns The registry.
 */
function buildRegistry (rules: Record<string, Exported>, adapters: RuleSyntax[]): Registry {
	let registry: Registry = {}

	for (let [name, exported] of Object.entries(rules)) {
		if (`ruleName` in exported) {
			registry[name] = exported
			continue
		}

		for (let syntax of adapters) registry[syntax.namespace ? `${syntax.namespace}/${name}` : name] = exported(syntax)
	}

	return registry
}

/**
 * Loads the rule registry of a checkout, so that a base and a branch can be asked in one process.
 * @param lib - The path of the checkout's `lib/` directory.
 * @returns The registry, keyed by the rule's name behind `@stylistic/`.
 */
async function loadRules (lib: string): Promise<Registry> {
	let module = await import(path.join(lib, `rules`, `index.ts`))

	if (!existsSync(path.join(lib, `syntaxes`, `index.ts`))) return buildRegistry(module.default, [])

	let [{ css }, { namespaces }] = await Promise.all([import(path.join(lib, `syntaxes`, `css`, `index.ts`)), import(path.join(lib, `syntaxes`, `index.ts`))])

	return buildRegistry(module.default, [css, ...namespaces])
}

/**
 * Reads the rules of a configuration as the runner takes them: by their short names, in the order the configuration spells them.
 * @param rules - The rules of the configuration, under their namespaced names.
 * @returns Each rule with its options.
 */
function settingsOf (rules: Record<string, unknown>): RuleSetting[] {
	return Object.entries(rules).map(([name, setting]) => {
		let [primary, secondary] = Array.isArray(setting) ? setting : [setting]

		return [name.replace(`@stylistic/`, ``), primary, secondary] as RuleSetting
	})
}

/**
 * Lints a text under the rules given, in the order given.
 * @param options - What to lint and how.
 * @param options.code - The text.
 * @param options.rules - Each rule by its short name, with its primary option and, where there is one, its secondary options; the order is the order the rules run in, which is the order a configuration would have listed them in.
 * @param options.registry - The rule registry to take the rules from, as `loadRules` returns it.
 * @param [options.syntax] - The syntax to read the text with; plain CSS where none is given.
 * @param [options.fix] - Whether the rules are let write.
 * @param [options.stripNamespaces] - Whether the namespace segment is read out of every warning's name and text, which is how the oracles compare a row measured under `@stylistic/less/<rule>` with one measured under `@stylistic/<rule>`; the tests compare texts as they stand, and leave this off. An objection to an option keeps its full name whatever this says, since Stylelint keeps it there. `verify-lint.ts` compares such a text with the flag off; the case beside this module is what pins the name under the flag.
 * @returns What the rules said and wrote, or why the text could not be read at all. A run whose `invalidOptions` stand empty is one no rule objected to, which is what `isUsable` of the oracles asks.
 */
async function lintDirect ({ code, rules, registry, syntax, fix = false, stripNamespaces = false }: {
	code: string,
	rules: RuleSetting[],
	registry: Registry,
	syntax?: string | Syntax | undefined,
	fix?: boolean,
	stripNamespaces?: boolean,
}): Promise<Answer> {
	let parser = await loadSyntax(syntax)

	let result: PostcssResult

	try {
		result = postcss().process(code, { from: undefined, syntax: parser }).sync() as PostcssResult
	}
	catch (error) {
		let { reason, message } = error as {
			reason?: string,
			message: string,
		}

		return { unparsable: true, detail: reason ?? message }
	}

	// `validate` is what `stylelint.utils.validateOptions` opens by reading, and a configuration without it makes that util hand back `true` for every option of every rule: no rule would refuse an option it does not take, and every `if (!validOptions) return` would be dead. The linter's own default is `true`, so the runner carries it too
	let config: {
		fix: boolean,
		rules: Record<string, [unknown, object | undefined]>,
		validate: boolean,
		customSyntax?: string,
	} = { fix, rules: {}, validate: true, ...(typeof syntax === `string` && { customSyntax: syntax }) }

	let ruleSeverities: Record<string, RuleSeverity> = {}

	let ruleMetadata: Record<string, Partial<RuleMeta>> = {}
	// The least of a result the rules read: `report` looks the rule's severity, its metadata and the configuration up here, and the fields it never touches are left out
	let stylelint = { ruleSeverities, customMessages: {}, customUrls: {}, ruleMetadata, fixersData: {}, rangesOfComputedEditInfos: [], disabledRanges: {}, config } as unknown as StylelintPostcssResult

	result.stylelint = stylelint

	let context = { configurationComment: CONFIGURATION_COMMENT, newline: code.match(BREAK_AS_STYLELINT_READS_IT)?.[0] ?? EOL }
	let parsed = result.root as Root | Document
	let roots = parsed.type === `document` ? parsed.nodes : [parsed]

	let resolved = rules.map(([name, primary, secondary]): [Rule, unknown, object | undefined] => {
		// A base from before a namespace answers under the bare name, which is how one comparison spans the commit that renamed an axis
		let rule = registry[name] ?? registry[name.replace(LEADING_NAMESPACE_SEGMENT, ``)]

		if (!rule) throw new Error(`No rule named "${name}" in the registry`)

		return [rule, primary, secondary]
	})

	// The whole configuration stands before any rule runs, as it does in Stylelint, where `result.stylelint.config` is assigned once and a rule reads a neighbour's setting out of it whichever of the two the configuration lists first
	for (let [rule, primary, secondary] of resolved) {
		// The resolved instance's own name, so that the severities and the config a report reads stand under the name the rule reports with — on a base answering under the bare name as much as on this checkout
		let fullName = rule.ruleName

		config.rules[fullName] = [primary, secondary]
		ruleSeverities[fullName] = SEVERITY
		ruleMetadata[fullName] = rule.meta ?? {}
	}

	for (let [rule, primary, secondary] of resolved) {
		let check = rule(primary, secondary, context)

		for (let root of roots) {
			// A rule may return a promise, and Stylelint awaits every rule before reading the result
			// eslint-disable-next-line no-await-in-loop
			await check(root, result)
		}
	}

	let warnings: Warning[] = []
	let invalidOptions: string[] = []

	// What `report` hangs on a warning beyond what PostCSS declares: the kind of warning where it is not a rule's, and the rule where it is
	for (let warning of (result.warnings() as (PostcssWarning & {
		stylelintType?: string,
		rule?: string,
	})[])) {
		if (warning.stylelintType === `invalidOption`) {
			invalidOptions.push(warning.text)
			continue
		}

		if (warning.stylelintType) continue

		warnings.push(stripNamespaces
			? { rule: warning.rule?.replace(EVERY_NAMESPACE_SEGMENT, ``), text: warning.text.replace(EVERY_NAMESPACE_SEGMENT, ``), line: warning.line, column: warning.column, endLine: warning.endLine, endColumn: warning.endColumn }
			: { rule: warning.rule, text: warning.text, line: warning.line, column: warning.column, endLine: warning.endLine, endColumn: warning.endColumn })
	}

	return { unparsable: false, invalidOptions, warnings, code: result.root.toString(parser.stringify) }
}

/** The registries already loaded, by the plugin path a configuration names. */
let registries: Map<string, Registry> = new Map()

/**
 * Lints the way `stylelint.lint` is called by the oracles, and answers in the shape they read.
 *
 * The configuration is the one `runs.ts` builds — a plugin named by its path, a syntax named by its package, and one rule or several under their namespaced names — and the answer carries `results[0].warnings`, `results[0].invalidOptionWarnings` and `code`, which is all an oracle reads of Stylelint's. A text the syntax cannot read answers with a warning whose rule is `CssSyntaxError`, as Stylelint's does.
 * @param options - The options `stylelint.lint` would have taken.
 * @param options.code - The text.
 * @param options.config - The configuration.
 * @param [options.fix] - Whether the rules are let write.
 * @returns The answer, shaped like Stylelint's.
 */
async function lint ({ code, config, fix = false }: {
	code: string,
	config: Config,
	fix?: boolean,
}): Promise<{
	results: [{ warnings: Warning[], invalidOptionWarnings: { text: string }[] }],
	code: string | undefined,
}> {
	let [plugin] = config.plugins

	if (!plugin) throw new Error(`The configuration names no plugin`)

	let registry = registries.get(plugin)

	if (!registry) {
		registry = await loadRules(path.dirname(plugin))
		registries.set(plugin, registry)
	}

	let answer = await lintDirect({ code, rules: settingsOf(config.rules), registry, syntax: config.customSyntax, fix, stripNamespaces: true })

	if (answer.unparsable) return { results: [{ warnings: [{ rule: `CssSyntaxError`, text: `${answer.detail} (CssSyntaxError)`, severity: SEVERITY }], invalidOptionWarnings: [] }], code: undefined }

	return {
		results: [{ warnings: answer.warnings, invalidOptionWarnings: answer.invalidOptions.map((text) => ({ text })) }],
		code: fix ? answer.code : undefined,
	}
}

export { buildRegistry, lint, lintDirect, loadRules, loadSyntax, settingsOf }
