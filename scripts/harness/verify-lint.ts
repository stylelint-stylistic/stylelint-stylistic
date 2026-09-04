#!/usr/bin/env node

/**
 * Proves that `lintDirect` says and writes what `stylelint.lint` says and writes, over every run the oracles make.
 *
 * Every rule under every primary option over every fixture of the shared corpus, under each syntax, is linted twice by each of the two — once for its warnings and once for its fix — and the four answers are compared field by field: whether the syntax read the text at all, in what words the rules refused their options, every warning's rule, text and four positions, and the text the fix left. Then every fixture is linted under pairs of rules in both orders, since a run of several rules is where the runner has to reproduce the order Stylelint gives a plugin's rules. Then every rule is handed, under every syntax, two settings no rule takes, since no option of `options.ts` is refused and a refusal compared nowhere is a field the two are free to part on. A disagreement is printed and fails the script; the counts of runs compared and of refusals among them are printed either way, so that a pull request can quote them.
 */

import { exit, stdout } from "node:process"

import stylelint from "stylelint"

import { RULE_OPTIONS } from "../oracles/options.ts"
import { buildRuns, type Run } from "../oracles/runs.ts"

import { type Answer, type Config, lintDirect, loadRules, settingsOf } from "./lint.ts"

/** The registry of this checkout, which is the one every oracle reads too. */
const REGISTRY = await loadRules(new URL(`../../lib`, import.meta.url).pathname)

/** How many neighbouring rules of the option list are paired for the two-rule runs. */
const PAIRS_PER_FIXTURE = 24

/** The settings put to every rule so that a refusal is compared: a keyword no option list holds, and the `false` Stylelint answers with a message of its own. Shortening the list narrows what is compared and no count can say so, since every count here is derived from the list itself. */
const SETTINGS_NO_RULE_TAKES = [`there-is-no-such-option`, false]

/** Every run the oracles make, which is what this script stands over. */
let runs = buildRuns()

/** How many rule-and-syntax pairs a refusal has to have been compared over: every rule of the option list, under every syntax the corpus is read under. */
const REFUSALS_EXPECTED = new Set(runs.map((run) => run.syntaxName)).size * Object.keys(RULE_OPTIONS).length

/** How many runs stand on a setting no rule takes: each of those pairs, under every such setting, checked and fixed. */
const REFUSALS_PUT = REFUSALS_EXPECTED * SETTINGS_NO_RULE_TAKES.length * 2

/**
 * Asks Stylelint, and shapes its answer like the runner's.
 * @param code - The text.
 * @param config - The configuration, as the oracles build one.
 * @param fix - Whether the rules are let write.
 * @returns The answer in the runner's shape.
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
 * Asks the runner under the same configuration.
 * @param code - The text.
 * @param config - The configuration, as the oracles build one.
 * @param fix - Whether the rules are let write.
 * @returns The answer.
 */
function askRunner (code: string, config: Config, fix: boolean): Promise<Answer> {
	return lintDirect({ code, rules: settingsOf(config.rules), registry: REGISTRY, syntax: config.customSyntax, fix })
}

/**
 * Compares the two answers, and names the first field they differ in.
 * @param expected - What Stylelint said.
 * @param actual - What the runner said.
 * @returns The field, or null where the two agree.
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
 * @param label - What to print where the two disagree.
 * @param code - The text.
 * @param config - The configuration.
 * @returns Whether either pass was refused its options; a disagreement is recorded rather than returned.
 */
async function compare (label: string, code: string, config: Config): Promise<boolean> {
	let refusedHere = false

	for (let fix of [false, true]) {
		// The two are asked in turn so that a run of this script stays as light on the machine as the oracle it stands in for
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

// A refusal is put under every syntax, since an objection names the rule the way the rule reports — with the namespace segment a syntax registers it under — and that is a text the runner has to spell as Stylelint spells it. What varies between the three is the name the configuration spells, not the parse: a rule refuses its options before it has read anything, so the fixture each refusal stands over is only whatever the corpus offers first, and the text the fix leaves is compared beside the objection all the same
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

// What the two counts hold the script to is that a refusal was compared over every rule of the option list and every syntax of the corpus. The pairs are counted against the corpus rather than against the loop, so a loop narrowed to one syntax ends the run and an emptied list of settings ends it too; a shortened one does not, since every count here is derived from that list. A setting some rule turns out to take, and a row of `options.ts` the plugin refuses, each move the count of refusals without showing up as a disagreement
if (refused !== REFUSALS_PUT) stdout.write(`${refused} refusals where ${REFUSALS_PUT} were put: a setting handed to every rule is one some rule takes, or a row of options.ts is one no rule takes\n`)
if (refusalsCompared.size !== REFUSALS_EXPECTED) stdout.write(`a refusal was compared over ${refusalsCompared.size} rule-and-syntax pairs of ${REFUSALS_EXPECTED}\n`)

for (let failure of failures.slice(0, 20)) stdout.write(`${JSON.stringify(failure, null, `\t`)}\n`)

exit(failures.length === 0 && refused === REFUSALS_PUT && refusalsCompared.size === REFUSALS_EXPECTED ? 0 : 1)
