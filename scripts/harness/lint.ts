/**
 * Lints one text under one or more rules of this plugin the way Stylelint would, without Stylelint.
 *
 * A call of `stylelint.lint` over a snippet costs about 0.8 ms on this machine, and 0.7 of them are the linter around the rule — a linter created for the call, a configuration searched for and augmented, an ignore file looked up, reference roots loaded, disable comments walked. The parse and the rule cost 0.05 ms together. An oracle or a sweep makes hundreds of thousands of such calls over snippets that carry no configuration comment and no ignore file, so the runner here does what `lintPostcssResult.mjs` does for one rule and nothing of the rest: it parses, hangs the `stylelint` object `report()` reads on the result, calls the rule, and hands back what the rule said and what it wrote. `verify-lint.ts` is the proof that the two agree, run over every run the oracles make.
 *
 * What is not reproduced, since no corpus of this repository carries it: disable comments and their ranges, `ignoreDisables`, `quiet`, `computeEditInfo`, the lexer and the reference roots. A rule reaching for one of them would show up in the verification as a disagreement rather than as a wrong answer.
 */

import { EOL } from "node:os"
import path from "node:path"

import postcss, { type Document, type Root, type Syntax, type Warning as PostcssWarning } from "postcss"
import type { PostcssResult, Rule, RuleMeta, RuleSeverity, StylelintPostcssResult } from "stylelint"

import { entryAt } from "./checkout.ts"
import { BREAK_AS_STYLELINT_READS_IT } from "./regexps.ts"

/** The comment word Stylelint reads its configuration comments by, which no fixture carries and which a rule may still ask about. */
const CONFIGURATION_COMMENT = `stylelint`

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

/** The rules of one checkout by their short names, as `lib/rules/index.js` exports them. */
export type Registry = Record<string, Rule>

/** What the rules said and wrote, or why the text could not be read. */
export type Answer = {
	unparsable: true,
	detail: string,
} | {
	unparsable: false,
	usable: boolean,
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
 * Loads the rule registry of a checkout, so that a base and a branch can be asked in one process.
 * @param lib - The path of the checkout's `lib/` directory.
 * @returns The registry, keyed by the rule's short name.
 */
async function loadRules (lib: string): Promise<Registry> {
	let module = await import(entryAt(lib, `rules/index`))

	return module.default
}

/**
 * Names a rule the way a configuration does.
 * @param name - The short name.
 * @returns The namespaced one.
 */
function namespaced (name: string): string {
	return name.startsWith(`@stylistic/`) ? name : `@stylistic/${name}`
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
 * @returns What the rules said and wrote, or why the text could not be read at all. A run is `usable` where no rule objected to its options, as `isUsable` of the oracles has it.
 */
async function lintDirect ({ code, rules, registry, syntax, fix = false }: {
	code: string,
	rules: RuleSetting[],
	registry: Registry,
	syntax?: string | Syntax | undefined,
	fix?: boolean,
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

	let config: {
		fix: boolean,
		rules: Record<string, [unknown, object | undefined]>,
	} = { fix, rules: {} }

	let ruleSeverities: Record<string, RuleSeverity> = {}

	let ruleMetadata: Record<string, Partial<RuleMeta>> = {}
	// The least of a result the rules read: `report` looks the rule's severity, its metadata and the configuration up here, and the fields it never touches are left out
	let stylelint = { ruleSeverities, customMessages: {}, customUrls: {}, ruleMetadata, fixersData: {}, rangesOfComputedEditInfos: [], disabledRanges: {}, config } as unknown as StylelintPostcssResult

	result.stylelint = stylelint

	let context = { configurationComment: CONFIGURATION_COMMENT, newline: code.match(BREAK_AS_STYLELINT_READS_IT)?.[0] ?? EOL }
	let parsed = result.root as Root | Document
	let roots = parsed.type === `document` ? parsed.nodes : [parsed]

	for (let [name, primary, secondary] of rules) {
		let rule = registry[name]

		if (!rule) throw new Error(`No rule named "${name}" in the registry`)

		let fullName = namespaced(name)

		config.rules[fullName] = [primary, secondary]
		ruleSeverities[fullName] = SEVERITY
		ruleMetadata[fullName] = rule.meta ?? {}

		let check = rule(primary, secondary, context)

		for (let root of roots) {
			// A rule may return a promise, and Stylelint awaits every rule before reading the result
			// eslint-disable-next-line no-await-in-loop
			await check(root, result)
		}
	}

	let warnings: Warning[] = []
	let usable = true

	// What `report` hangs on a warning beyond what PostCSS declares: the kind of warning where it is not a rule's, and the rule where it is
	for (let warning of (result.warnings() as (PostcssWarning & {
		stylelintType?: string,
		rule?: string,
	})[])) {
		if (warning.stylelintType === `invalidOption`) {
			usable = false
			continue
		}

		if (warning.stylelintType) continue

		warnings.push({ rule: warning.rule, text: warning.text, line: warning.line, column: warning.column, endLine: warning.endLine, endColumn: warning.endColumn })
	}

	return { unparsable: false, usable, warnings, code: result.root.toString(parser.stringify) }
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

	let answer = await lintDirect({ code, rules: settingsOf(config.rules), registry, syntax: config.customSyntax, fix })

	if (answer.unparsable) return { results: [{ warnings: [{ rule: `CssSyntaxError`, text: `${answer.detail} (CssSyntaxError)`, severity: SEVERITY }], invalidOptionWarnings: [] }], code: undefined }

	return {
		results: [{ warnings: answer.warnings, invalidOptionWarnings: answer.usable ? [] : [{ text: `invalid option` }] }],
		code: fix ? answer.code : undefined,
	}
}

export { lint, lintDirect, loadRules, loadSyntax, settingsOf }
