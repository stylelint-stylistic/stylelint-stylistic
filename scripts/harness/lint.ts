/**
 * Lints one text under this plugin's rules the way Stylelint would, without Stylelint.
 *
 * A `stylelint.lint` call costs about 0.8 ms and a sweep makes hundreds of thousands, so this does what `lintPostcssResult.mjs` does for one rule; `verify-lint.ts` proves the two agree. Not reproduced: disable comments and ranges, `ignoreDisables`, `quiet`, `computeEditInfo`, the lexer and the reference roots.
 */

import { existsSync } from "node:fs"
import { EOL } from "node:os"
import path from "node:path"

import postcss, { type Document, type Root, type Syntax, type Warning as PostcssWarning } from "postcss"
import type { PostcssResult, Rule, RuleMeta, RuleSeverity, StylelintPostcssResult } from "stylelint"

import type { Syntax as RuleSyntax } from "../../lib/syntaxes/index.ts"

import { BREAK_AS_STYLELINT_READS_IT } from "./regexps.ts"

/** Stylelint's configuration-comment word. */
const CONFIGURATION_COMMENT = `stylelint`

/** Every namespace segment behind `@stylistic/`. */
const EVERY_NAMESPACE_SEGMENT = /(?<=@stylistic\/)[a-z]+\//gu

/** The namespace segment heading a registry key. */
const LEADING_NAMESPACE_SEGMENT = /^[a-z]+\//u

/** The severity of every rule. */
const SEVERITY = `error`

/** What a rule said; a parse error has no position. */
export type Warning = {
	rule?: string | undefined,
	text: string,
	line?: number | undefined,
	column?: number | undefined,
	endLine?: number | undefined,
	endColumn?: number | undefined,
	severity?: string | undefined,
}

/** A rule by short name with its options. */
export type RuleSetting = [string, unknown, (object | undefined)?]

/** The rules of a checkout by the name behind `@stylistic/`. */
export type Registry = Record<string, Rule>

/** A factory per rule, or the rule itself on a pre-factory checkout. */
type Exported = Rule | ((syntax: RuleSyntax) => Rule)

/** What the rules said and wrote, or why the text could not be read; `invalidOptions` holds `validateOptions`' objections. */
export type Answer = {
	unparsable: true,
	detail: string,
} | {
	unparsable: false,
	invalidOptions: string[],
	warnings: Warning[],
	code: string,
}

/** The configuration `runs.ts` builds. */
export type Config = {
	plugins: string[],
	customSyntax?: string,
	rules: Record<string, unknown>,
}

/** The syntaxes loaded, by package name. */
let syntaxes: Map<string, Syntax> = new Map()

/**
 * Loads a syntax by package name, or returns the one given.
 * @param syntax - A package name, a syntax, or nothing for plain CSS.
 * @returns The syntax.
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
 * Builds the registry: every factory called for the core and each namespace; a pre-factory checkout's rules are filed as they are, since a base runs through the branch's harness.
 * @param rules - A checkout's `lib/rules/index.ts` export.
 * @param adapters - The core's syntax, then every namespace's.
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
 * Loads a checkout's registry, so a base and a branch can be asked in one process.
 * @param lib - The checkout's `lib/`.
 * @returns The registry.
 */
async function loadRules (lib: string): Promise<Registry> {
	let module = await import(path.join(lib, `rules`, `index.ts`))

	if (!existsSync(path.join(lib, `syntaxes`, `index.ts`))) return buildRegistry(module.default, [])

	let [{ css }, { namespaces }] = await Promise.all([import(path.join(lib, `syntaxes`, `css`, `index.ts`)), import(path.join(lib, `syntaxes`, `index.ts`))])

	return buildRegistry(module.default, [css, ...namespaces])
}

/**
 * Reads a configuration's rules as short names in configuration order.
 * @param rules - The configuration's rules.
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
 * @param options.rules - The rules in configuration order.
 * @param options.registry - The side's rules by name.
 * @param [options.syntax] - The syntax; plain CSS by default.
 * @param [options.fix] - Whether the rules may write.
 * @param [options.stripNamespaces] - Whether warnings lose their namespace segment, for comparing a `less/` row with a core one.
 * @returns What the rules said and wrote.
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

	// Without `validate`, `validateOptions` answers `true` for every option
	let config: {
		fix: boolean,
		rules: Record<string, [unknown, object | undefined]>,
		validate: boolean,
		customSyntax?: string,
	} = { fix, rules: {}, validate: true, ...(typeof syntax === `string` && { customSyntax: syntax }) }

	let ruleSeverities: Record<string, RuleSeverity> = {}

	let ruleMetadata: Record<string, Partial<RuleMeta>> = {}
	// The least of a result `report` reads
	let stylelint = { ruleSeverities, customMessages: {}, customUrls: {}, ruleMetadata, fixersData: {}, rangesOfComputedEditInfos: [], disabledRanges: {}, config } as unknown as StylelintPostcssResult

	result.stylelint = stylelint

	let context = { configurationComment: CONFIGURATION_COMMENT, newline: code.match(BREAK_AS_STYLELINT_READS_IT)?.[0] ?? EOL }
	let parsed = result.root as Root | Document
	let roots = parsed.type === `document` ? parsed.nodes : [parsed]

	let resolved = rules.map(([name, primary, secondary]): [Rule, unknown, object | undefined] => {
		// A base from before the namespaces answers under the bare name
		let rule = registry[name] ?? registry[name.replace(LEADING_NAMESPACE_SEGMENT, ``)]

		if (!rule) throw new Error(`No rule named "${name}" in the registry`)

		return [rule, primary, secondary]
	})

	// The whole configuration stands before any rule runs, as in Stylelint
	for (let [rule, primary, secondary] of resolved) {
		// The instance's own name, for a bare-named base
		let fullName = rule.ruleName

		config.rules[fullName] = [primary, secondary]
		ruleSeverities[fullName] = SEVERITY
		ruleMetadata[fullName] = rule.meta ?? {}
	}

	for (let [rule, primary, secondary] of resolved) {
		let check = rule(primary, secondary, context)

		for (let root of roots) {
			// Stylelint awaits every rule
			// eslint-disable-next-line no-await-in-loop
			await check(root, result)
		}
	}

	let warnings: Warning[] = []
	let invalidOptions: string[] = []

	// `stylelintType` marks a warning that is not a rule's
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

/** The registries loaded, by plugin path. */
let registries: Map<string, Registry> = new Map()

/**
 * Lints as the oracles call `stylelint.lint`, in the shape they read; an unreadable text answers with a `CssSyntaxError` warning.
 * @param options - As for `stylelint.lint`.
 * @param options.code - The text.
 * @param options.config - The configuration.
 * @param [options.fix] - Whether the rules may write.
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
