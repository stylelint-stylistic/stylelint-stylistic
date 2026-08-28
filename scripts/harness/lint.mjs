/**
 * Lints one text under one or more rules of this plugin the way Stylelint would, without Stylelint.
 *
 * A call of `stylelint.lint` over a snippet costs about 0.8 ms on this machine, and 0.7 of them are the linter around the rule — a linter created for the call, a configuration searched for and augmented, an ignore file looked up, reference roots loaded, disable comments walked. The parse and the rule cost 0.05 ms together. An oracle or a sweep makes hundreds of thousands of such calls over snippets that carry no configuration comment and no ignore file, so the runner here does what `lintPostcssResult.mjs` does for one rule and nothing of the rest: it parses, hangs the `stylelint` object `report()` reads on the result, calls the rule, and hands back what the rule said and what it wrote. `verify-lint.mjs` is the proof that the two agree, run over every run the oracles make.
 *
 * What is not reproduced, since no corpus of this repository carries it: disable comments and their ranges, `ignoreDisables`, `quiet`, `computeEditInfo`, the lexer and the reference roots. A rule reaching for one of them would show up in the verification as a disagreement rather than as a wrong answer.
 */

import { EOL } from "node:os"
import path from "node:path"

import postcss from "postcss"

import { BREAK_AS_STYLELINT_READS_IT } from "./regexps.mjs"

/** The comment word Stylelint reads its configuration comments by, which no fixture carries and which a rule may still ask about. */
const CONFIGURATION_COMMENT = `stylelint`

/** The severity every rule is given, since a run here has no configuration to set another. */
const SEVERITY = `error`

/** The syntaxes a run can name, each loaded once on first use. */
let syntaxes = new Map()

/**
 * Loads a syntax by the name a configuration spells it with, or hands back the one given.
 * @param {string | { parse: Function, stringify: Function } | undefined} syntax - A package name such as `postcss-scss`, a syntax object, or nothing for plain CSS.
 * @returns {Promise<{ parse: Function, stringify: Function }>} The syntax to parse and print with.
 */
async function loadSyntax (syntax) {
	if (!syntax) return postcss
	if (typeof syntax !== `string`) return syntax

	if (!syntaxes.has(syntax)) {
		let module = await import(syntax)

		syntaxes.set(syntax, module.default ?? module)
	}

	return syntaxes.get(syntax)
}

/**
 * Loads the rule registry of a checkout, so that a base and a branch can be asked in one process.
 * @param {string} lib - The path of the checkout's `lib/` directory.
 * @returns {Promise<Record<string, Function>>} The registry, keyed by the rule's short name.
 */
async function loadRules (lib) {
	let module = await import(`${lib}/rules/index.js`)

	return module.default
}

/**
 * Names a rule the way a configuration does.
 * @param {string} name - The short name.
 * @returns {string} The namespaced one.
 */
function namespaced (name) {
	return name.startsWith(`@stylistic/`) ? name : `@stylistic/${name}`
}

/**
 * Lints a text under the rules given, in the order given.
 * @param {object} options - What to lint and how.
 * @param {string} options.code - The text.
 * @param {Array<[string, unknown, object?]>} options.rules - Each rule by its short name, with its primary option and, where there is one, its secondary options; the order is the order the rules run in, which is the order a configuration would have listed them in.
 * @param {Record<string, Function>} options.registry - The rule registry to take the rules from, as `loadRules` returns it.
 * @param {string | object} [options.syntax] - The syntax to read the text with; plain CSS where none is given.
 * @param {boolean} [options.fix] - Whether the rules are let write.
 * @returns {Promise<{ unparsable: true, detail: string } | { unparsable: false, usable: boolean, warnings: object[], code: string }>} What the rules said and wrote, or why the text could not be read at all. A run is `usable` where no rule objected to its options, as `isUsable` of the oracles has it.
 */
async function lintDirect ({ code, rules, registry, syntax, fix = false }) {
	let parser = await loadSyntax(syntax)
	let result

	try {
		result = postcss().process(code, { from: undefined, syntax: parser }).sync()
	}
	catch (error) {
		return { unparsable: true, detail: error.reason ?? error.message }
	}

	let config = { fix, rules: {} }
	let stylelint = { ruleSeverities: {}, customMessages: {}, customUrls: {}, ruleMetadata: {}, fixersData: {}, rangesOfComputedEditInfos: [], disabledRanges: {}, config }

	result.stylelint = stylelint

	let context = { configurationComment: CONFIGURATION_COMMENT, newline: code.match(BREAK_AS_STYLELINT_READS_IT)?.[0] ?? EOL }
	let roots = result.root.type === `document` ? result.root.nodes : [result.root]

	for (let [name, primary, secondary] of rules) {
		let rule = registry[name]

		if (!rule) throw new Error(`No rule named "${name}" in the registry`)

		let fullName = namespaced(name)

		config.rules[fullName] = [primary, secondary]
		stylelint.ruleSeverities[fullName] = SEVERITY
		stylelint.ruleMetadata[fullName] = rule.meta ?? {}

		let check = rule(primary, secondary, context)

		for (let root of roots) {
			// A rule may return a promise, and Stylelint awaits every rule before reading the result
			// eslint-disable-next-line no-await-in-loop
			await check(root, result)
		}
	}

	let warnings = []
	let usable = true

	for (let warning of result.warnings()) {
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
let registries = new Map()

/**
 * Lints the way `stylelint.lint` is called by the oracles, and answers in the shape they read.
 *
 * The configuration is the one `runs.mjs` builds — a plugin named by its path, a syntax named by its package, and one rule or several under their namespaced names — and the answer carries `results[0].warnings`, `results[0].invalidOptionWarnings` and `code`, which is all an oracle reads of Stylelint's. A text the syntax cannot read answers with a warning whose rule is `CssSyntaxError`, as Stylelint's does.
 * @param {object} options - The options `stylelint.lint` would have taken.
 * @param {string} options.code - The text.
 * @param {object} options.config - The configuration.
 * @param {boolean} [options.fix] - Whether the rules are let write.
 * @returns {Promise<{ results: [{ warnings: object[], invalidOptionWarnings: object[] }], code: string | undefined }>} The answer, shaped like Stylelint's.
 */
async function lint ({ code, config, fix = false }) {
	let [plugin] = config.plugins

	if (!registries.has(plugin)) registries.set(plugin, await loadRules(path.dirname(plugin)))

	let rules = Object.entries(config.rules).map(([name, setting]) => {
		let [primary, secondary] = Array.isArray(setting) ? setting : [setting]

		return [name.replace(`@stylistic/`, ``), primary, secondary]
	})
	let answer = await lintDirect({ code, rules, registry: registries.get(plugin), syntax: config.customSyntax, fix })

	if (answer.unparsable) return { results: [{ warnings: [{ rule: `CssSyntaxError`, text: `${answer.detail} (CssSyntaxError)`, severity: SEVERITY }], invalidOptionWarnings: [] }], code: undefined }

	return {
		results: [{ warnings: answer.warnings, invalidOptionWarnings: answer.usable ? [] : [{ text: `invalid option` }] }],
		code: fix ? answer.code : undefined,
	}
}

export { lint, lintDirect, loadRules, loadSyntax }
