#!/usr/bin/env node

/**
 * Proves that `lintDirect` says and writes what `stylelint.lint` does, over every run the oracles make.
 *
 * Each run is linted by both, checking and fixing, and the answers compared field by field; then every fixture under pairs of rules in both orders, since the runner reproduces Stylelint's rule order, and every rule under settings no rule takes, so a refusal is compared too.
 */

import { exit, stdout } from "node:process"

import stylelint from "stylelint"

import { RULE_OPTIONS } from "../oracles/options.ts"
import { buildRuns, type Run } from "../oracles/runs.ts"

import { type Answer, type Config, lintDirect, loadRules, settingsOf } from "./lint.ts"

/** The registry of this checkout. */
const REGISTRY = await loadRules(new URL(`../../lib`, import.meta.url).pathname)

/** How many rule pairs are run per fixture. */
const PAIRS_PER_FIXTURE = 24

/** Settings no rule takes; every count derives from this list, so none can see it shortened. */
const SETTINGS_NO_RULE_TAKES = [`there-is-no-such-option`, false]

/** Every run the oracles make. */
let runs = buildRuns()

/** Rule-and-syntax pairs a refusal must be compared over. */
const REFUSALS_EXPECTED = new Set(runs.map((run) => run.syntaxName)).size * Object.keys(RULE_OPTIONS).length

/** Runs on a setting no rule takes. */
const REFUSALS_PUT = REFUSALS_EXPECTED * SETTINGS_NO_RULE_TAKES.length * 2

/**
 * Asks Stylelint and shapes the answer like the runner's.
 * @param code - The text.
 * @param config - The configuration.
 * @param fix - Whether to fix.
 * @returns The answer.
 */
async function askStylelint (code: string, config: Config, fix: boolean): Promise<Answer> {
	let result

	try {
		result = await stylelint.lint({ code, config, fix })
	}
	catch (error) {
		return { unparsable: true, detail: (error as { message: string }).message }
	}

	let [first] = result.results

	if (!first) throw new Error(`Stylelint answered with no result`)

	let parseError = first.warnings.find((warning) => warning.rule === `CssSyntaxError`)

	if (parseError) return { unparsable: true, detail: parseError.text }

	return {
		unparsable: false,
		invalidOptions: first.invalidOptionWarnings.map(({ text }) => text),
		warnings: first.warnings.map(({ rule, text, line, column, endLine, endColumn }) => ({ rule, text, line, column, endLine, endColumn })),
		code: result.code ?? code,
	}
}

/**
 * Asks the runner.
 * @param code - The text.
 * @param config - The configuration.
 * @param fix - Whether to fix.
 * @returns The answer.
 */
function askRunner (code: string, config: Config, fix: boolean): Promise<Answer> {
	return lintDirect({ code, rules: settingsOf(config.rules), registry: REGISTRY, syntax: config.customSyntax, fix })
}

/**
 * Names the first field the two answers differ in.
 * @param expected - Stylelint's.
 * @param actual - The runner's.
 * @returns The field, or null.
 */
function disagreement (expected: Answer, actual: Answer): string | null {
	if (expected.unparsable !== actual.unparsable) return `unparsable`
	if (expected.unparsable || actual.unparsable) return null
	if (JSON.stringify(expected.invalidOptions) !== JSON.stringify(actual.invalidOptions)) return `invalidOptions`
	if (expected.code !== actual.code) return `code`
	if (JSON.stringify(expected.warnings) !== JSON.stringify(actual.warnings)) return `warnings`

	return null
}

let compared = 0
let refused = 0

let failures: {
	label: string,
	fix: boolean,
	field: string,
	expected: Answer,
	actual: Answer,
}[] = []

/**
 * Compares one configuration over one text, checking and fixing.
 * @param label - Printed on a disagreement.
 * @param code - The text.
 * @param config - The configuration.
 * @returns Whether either pass refused its options.
 */
async function compare (label: string, code: string, config: Config): Promise<boolean> {
	let refusedHere = false

	for (let fix of [false, true]) {
		// Asked in turn to keep the load down
		// eslint-disable-next-line no-await-in-loop
		let [expected, actual] = [await askStylelint(code, config, fix), await askRunner(code, config, fix)]
		let field = disagreement(expected, actual)

		compared += 1

		if (!expected.unparsable && expected.invalidOptions.length > 0) {
			refused += 1
			refusedHere = true
		}

		if (field) failures.push({ label, fix, field, expected, actual })
	}

	return refusedHere
}

for (let run of runs) {
	// eslint-disable-next-line no-await-in-loop
	await compare(`${run.rule} ${JSON.stringify(run.primary)} ${run.syntaxName} ${run.name}`, run.code, run.config)
}

let configs = Object.entries(RULE_OPTIONS).map(([rule, [primary]]) => [`@stylistic/${rule}`, primary] as [string, unknown])
let fixtures = new Map(runs.filter((run) => run.syntaxName === `css`).map((run) => [run.name, run]))

for (let [name, run] of fixtures) {
	for (let index = 0; index < PAIRS_PER_FIXTURE; index += 1) {
		let a = configs[(index * 3) % configs.length]
		let b = configs[((index * 3) + 1) % configs.length]

		if (!a || !b) throw new Error(`The option list holds no pair to run`)

		for (let [first, second] of [[a, b], [b, a]] as const) {
			// eslint-disable-next-line no-await-in-loop
			await compare(`${first[0]} then ${second[0]} css ${name}`, run.code, { plugins: run.config.plugins, rules: { [first[0]]: first[1], [second[0]]: second[1] } })
		}
	}
}

// A refusal is put under every syntax, since the objection names the rule under the syntax's namespace segment
let refusalFixtures: Map<string, Run> = new Map()
let refusalsCompared: Set<string> = new Set()

for (let run of runs) if (!refusalFixtures.has(run.syntaxName)) refusalFixtures.set(run.syntaxName, run)

for (let [syntaxName, run] of refusalFixtures) {
	for (let rule of Object.keys(RULE_OPTIONS)) {
		for (let setting of SETTINGS_NO_RULE_TAKES) {
			let name = syntaxName === `css` ? `@stylistic/${rule}` : `@stylistic/${syntaxName}/${rule}`

			// eslint-disable-next-line no-await-in-loop
			if (await compare(`${name} ${JSON.stringify(setting)} ${syntaxName} ${run.name}`, run.code, { ...run.config, rules: { [name]: setting } })) refusalsCompared.add(`${syntaxName}|${rule}`)
		}
	}
}

stdout.write(`${compared} runs compared, ${refused} of them refusing an option, ${failures.length} disagreements\n`)

// Pairs are counted against the corpus, so a narrowed loop or an emptied setting list fails. A setting some rule takes, or an `options.ts` row the plugin refuses, moves the refusal count without a disagreement
if (refused !== REFUSALS_PUT) stdout.write(`${refused} refusals where ${REFUSALS_PUT} were put: a setting handed to every rule is one some rule takes, or a row of options.ts is one no rule takes\n`)
if (refusalsCompared.size !== REFUSALS_EXPECTED) stdout.write(`a refusal was compared over ${refusalsCompared.size} rule-and-syntax pairs of ${REFUSALS_EXPECTED}\n`)

for (let failure of failures.slice(0, 20)) stdout.write(`${JSON.stringify(failure, null, `\t`)}\n`)

exit(failures.length === 0 && refused === REFUSALS_PUT && refusalsCompared.size === REFUSALS_EXPECTED ? 0 : 1)
