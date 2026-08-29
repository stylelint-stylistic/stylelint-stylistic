#!/usr/bin/env node

/**
 * Proves that `lintDirect` says and writes what `stylelint.lint` says and writes, over every run the oracles make.
 *
 * Every rule under every primary option over every fixture of the shared corpus, under each syntax, is linted twice by each of the two — once for its warnings and once for its fix — and the four answers are compared field by field: whether the syntax read the text at all, whether the rule accepted its options, every warning's rule, text and four positions, and the text the fix left. Then every fixture is linted under pairs of rules in both orders, since a run of several rules is where the runner has to reproduce the order Stylelint gives a plugin's rules. A disagreement is printed and fails the script; the count of runs compared is printed either way, so that a pull request can quote it.
 */

import { exit, stdout } from "node:process"

import stylelint from "stylelint"

import { RULE_OPTIONS } from "../oracles/options.mjs"
import { buildRuns, isUsable } from "../oracles/runs.mjs"

import { lintDirect, loadRules, settingsOf } from "./lint.mjs"

/** The registry of this checkout, which is the one every oracle reads too. */
const REGISTRY = await loadRules(new URL(`../../lib`, import.meta.url).pathname)

/** How many neighbouring rules of the option list are paired for the two-rule runs. */
const PAIRS_PER_FIXTURE = 24

/**
 * Asks Stylelint, and shapes its answer like the runner's.
 * @param {string} code - The text.
 * @param {import('./lint.mjs').Config} config - The configuration, as the oracles build one.
 * @param {boolean} fix - Whether the rules are let write.
 * @returns {Promise<import('./lint.mjs').Answer>} The answer in the runner's shape.
 */
async function askStylelint (code, config, fix) {
	let result

	try {
		result = await stylelint.lint({ code, config, fix })
	}
	catch (error) {
		return { unparsable: true, detail: /** @type {{ message: string }} */ (error).message }
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
 * @param {string} code - The text.
 * @param {import('./lint.mjs').Config} config - The configuration, as the oracles build one.
 * @param {boolean} fix - Whether the rules are let write.
 * @returns {Promise<import('./lint.mjs').Answer>} The answer.
 */
function askRunner (code, config, fix) {
	return lintDirect({ code, rules: settingsOf(config.rules), registry: REGISTRY, syntax: config.customSyntax, fix })
}

/**
 * Compares the two answers, and names the first field they differ in.
 * @param {import('./lint.mjs').Answer} expected - What Stylelint said.
 * @param {import('./lint.mjs').Answer} actual - What the runner said.
 * @returns {string | null} The field, or null where the two agree.
 */
function disagreement (expected, actual) {
	if (expected.unparsable !== actual.unparsable) return `unparsable`
	if (expected.unparsable || actual.unparsable) return null
	if (expected.usable !== actual.usable) return `usable`
	if (!expected.usable) return null
	if (expected.code !== actual.code) return `code`
	if (JSON.stringify(expected.warnings) !== JSON.stringify(actual.warnings)) return `warnings`

	return null
}

let compared = 0

/** @type {{ label: string, fix: boolean, field: string, expected: import('./lint.mjs').Answer, actual: import('./lint.mjs').Answer }[]} */
let failures = []

/**
 * Compares one configuration over one text, checking and fixing.
 * @param {string} label - What to print where the two disagree.
 * @param {string} code - The text.
 * @param {import('./lint.mjs').Config} config - The configuration.
 * @returns {Promise<void>} Nothing; a disagreement is recorded.
 */
async function compare (label, code, config) {
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

let configs = Object.entries(RULE_OPTIONS).map(([rule, [primary]]) => /** @type {[string, unknown]} */ ([`@stylistic/${rule}`, primary]))
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
