#!/usr/bin/env node

/**
 * Proves that `lintDirect` says and writes what `stylelint.lint` says and writes, over every run the oracles make.
 *
 * Every rule under every primary option over every fixture of the shared corpus, under each syntax, is linted twice by each of the two — once for its warnings and once for its fix — and the four answers are compared field by field: whether the syntax read the text at all, whether the rule accepted its options, every warning's rule, text and four positions, and the text the fix left. Then every fixture is linted under pairs of rules in both orders, since a run of several rules is where the runner has to reproduce the order Stylelint gives a plugin's rules. A disagreement is printed and fails the script; the count of runs compared is printed either way, so that a pull request can quote it.
 */

import { exit, stdout } from "node:process"

import stylelint from "stylelint"

import { RULE_OPTIONS } from "../oracles/options.ts"
import { buildRuns, isUsable } from "../oracles/runs.ts"

import { type Answer, type Config, lintDirect, loadRules, settingsOf } from "./lint.ts"

/** The registry of this checkout, which is the one every oracle reads too. */
const REGISTRY = await loadRules(new URL(`../../lib`, import.meta.url).pathname)

/** How many neighbouring rules of the option list are paired for the two-rule runs. */
const PAIRS_PER_FIXTURE = 24

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
	let parseError = first.warnings.find((warning) => warning.rule === `CssSyntaxError`)

	if (parseError) return { unparsable: true, detail: parseError.text }

	return {
		unparsable: false,
		usable: isUsable(first),
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
	if (expected.usable !== actual.usable) return `usable`
	if (!expected.usable) return null
	if (expected.code !== actual.code) return `code`
	if (JSON.stringify(expected.warnings) !== JSON.stringify(actual.warnings)) return `warnings`

	return null
}

let compared = 0

let failures: { label: string, fix: boolean, field: string, expected: Answer, actual: Answer }[] = []

/**
 * Compares one configuration over one text, checking and fixing.
 * @param label - What to print where the two disagree.
 * @param code - The text.
 * @param config - The configuration.
 * @returns Nothing; a disagreement is recorded.
 */
async function compare (label: string, code: string, config: Config): Promise<void> {
	for (let fix of [false, true]) {
		// The two are asked in turn so that a run of this script stays as light on the machine as the oracle it stands in for
		// eslint-disable-next-line no-await-in-loop
		let [expected, actual] = [await askStylelint(code, config, fix), await askRunner(code, config, fix)]
		let field = disagreement(expected, actual)

		compared += 1

		if (field) failures.push({ label, fix, field, expected, actual })
	}
}

let runs = buildRuns()

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

		for (let [first, second] of [[a, b], [b, a]]) {
			// eslint-disable-next-line no-await-in-loop
			await compare(`${first[0]} then ${second[0]} css ${name}`, run.code, { plugins: run.config.plugins, rules: { [first[0]]: first[1], [second[0]]: second[1] } })
		}
	}
}

stdout.write(`${compared} runs compared, ${failures.length} disagreements\n`)

for (let failure of failures.slice(0, 20)) stdout.write(`${JSON.stringify(failure, null, `\t`)}\n`)

exit(failures.length === 0 ? 0 : 1)
