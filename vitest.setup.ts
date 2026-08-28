import type { CreateTestRule, CreateTestRuleConfig } from "@morev/stylelint-testing-library"
import { createTestUtils } from "@morev/stylelint-testing-library"
import type { LinterOptions, LinterResult } from "stylelint"
import stylelint from "stylelint"
import { assert, describe, expect, it } from "vitest"

import rules from "./lib/rules/index.js"
import { lintDirect } from "./scripts/harness/lint.mjs"

// The plugin is named by its path rather than handed over as objects, so that the testing library has no plugin objects to deep-clone for every case that carries no line break — it clones them to force `context.newline`, which no rule of this plugin reads any more
const PLUGIN = new URL(`./lib/index.js`, import.meta.url).pathname

// The secondary options a rule's report is shaped by, which the runner below does not model
const REPORT_OPTIONS = new Set([`severity`, `message`, `url`, `disableFix`, `reportDisables`])

let lintWithTheLinter = stylelint.lint

/**
 * Asks whether a case reaches for what the runner does not model: a disable comment, a secondary option about the report, a file name, a plugin other than this one, or a configuration under test.
 * @param {LinterOptions} options - What `stylelint.lint` was called with.
 * @returns {boolean} True where the linter itself has to answer.
 */
function needsTheLinter (options: LinterOptions): boolean {
	if (typeof options.code !== `string` || options.code === `` || options.codeFilename || options.code.includes(`stylelint-`)) return true
	if (!Array.isArray(options.config?.plugins) || options.config.plugins.some((plugin) => plugin !== PLUGIN)) return true

	return Object.values(options.config.rules ?? {}).some((setting) => Array.isArray(setting) && setting[1] && Object.keys(setting[1]).some((key) => REPORT_OPTIONS.has(key)))
}

/**
 * Lints a case the way the oracles do, and answers in the shape the testing library reads.
 *
 * A run of the suite is some 9 000 cases of up to three lints each, and `stylelint.lint` spends nine tenths of a lint on the linter around the rule: a linter created for the call, a configuration searched for and augmented, an ignore file looked up, disable comments walked. The runner of the oracles does what the linter does for one rule and nothing of the rest, and `make harness-check RUN=1` is the proof that the two agree. The linter itself is called only where a case asks for what the runner does not model.
 * @param {LinterOptions} options - What `stylelint.lint` was called with.
 * @returns {Promise<LinterResult>} What the library reads of a linter result: the warnings, the parse errors, the option warnings and the text the fix left.
 */
async function lint (options: LinterOptions): Promise<LinterResult> {
	if (needsTheLinter(options)) return lintWithTheLinter(options)

	let ruleSettings = Object.entries(options.config?.rules ?? {}).map(([name, setting]): [string, unknown, object | undefined] => {
		let [primary, secondary] = Array.isArray(setting) ? setting : [setting]

		return [name.replace(`@stylistic/`, ``), primary, secondary]
	})
	let answer = await lintDirect({ code: options.code as string, rules: ruleSettings, registry: rules, syntax: options.customSyntax, fix: options.fix === true })
	let warnings = answer.unparsable
		? [{ rule: `CssSyntaxError`, severity: `error`, text: `${answer.detail} (CssSyntaxError)`, line: 1, column: 1 }]
		: answer.warnings.map((warning: object) => ({ ...warning, severity: `error` }))
	let code = answer.unparsable ? options.code : answer.code

	return { results: [{ warnings, parseErrors: [], invalidOptionWarnings: answer.unparsable || answer.usable ? [] : [{ text: `invalid option` }], _postcssResult: { root: { toString: () => code }, opts: {} } }] } as unknown as LinterResult
}

// The library and this file import one and the same `stylelint`, loaded by Node rather than by Vitest, and its default export is an object whose `lint` can be replaced in place
stylelint.lint = lint

let { createTestRule, createTestRuleConfig } = createTestUtils({
	testFunctions: { assert, describe, expect, it },
	plugins: [PLUGIN],
	autoStripIndent: true,
	testCaseWithoutDescriptionAppearance: `case-index`,
	testGroupWithoutDescriptionAppearance: `line-in-file`,
	contextNewlineFallback: `lf`,
})

globalThis.createTestRule = createTestRule
globalThis.createTestRuleConfig = createTestRuleConfig

declare global {
	var createTestRule: CreateTestRule
	var createTestRuleConfig: CreateTestRuleConfig
}
