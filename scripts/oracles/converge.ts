#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option it accepts, over every fixture: does `--fix` reach a fixed point, and does what it wrote still parse?
 *
 * A fixer that reports a problem, counts it fixed, and hands the next run the same problem is the shape of #131, #196 and #239. `testRule` cannot see it: it asserts `fixed` once and never runs the fixer twice.
 *
 * Three kinds of row come out:
 *
 * - `broke` — the output of a run does not parse. The worst kind: the file is destroyed.
 * - `not-idempotent` — the second run writes something the first did not. A user who runs the fixer once is left with a file the rule still has something to say about.
 * - `diverges` — the third run writes something the second did not, so nothing bounds it.
 */

import { stdout } from "node:process"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/**
 * Names a run, without carrying its configuration into the report.
 * @param run - The run to name.
 * @returns The four fields that identify it.
 */
function label (run: Run): object {
	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name }
}

/**
 * Runs the fixer three times over one fixture.
 * @param run - The rule, the option, the syntax and the fixture.
 * @returns The finding, or null where there is none.
 */
async function probe (run: Run): Promise<object | null> {
	let history = [run.code]
	let current = run.code

	for (let pass = 0; pass < 3; pass += 1) {
		let result

		try {
			// Each run reads what the one before it wrote, so the three cannot be made at once
			// eslint-disable-next-line no-await-in-loop
			result = await lint({ code: current, config: run.config, fix: true })
		}
		catch (error) {
			return { kind: `broke`, ...label(run), detail: `threw: ${(error as { message: string }).message}`, history }
		}

		let [first] = result.results
		let parseError = first.warnings.find((warning) => warning.rule === `CssSyntaxError`)

		if (parseError) return pass === 0 ? null : { kind: `broke`, ...label(run), detail: `run ${pass + 1}: ${parseError.text}`, history }
		if (!isUsable(first)) return null

		current = result.code ?? current
		history.push(current)
	}

	if (history[1] !== history[2]) return { kind: `not-idempotent`, ...label(run), history }
	if (history[2] !== history[3]) return { kind: `diverges`, ...label(run), history }

	return null
}

let findings: object[] = []

for (let run of buildRuns()) {
	// eslint-disable-next-line no-await-in-loop
	let finding = await probe(run)

	if (finding) findings.push(finding)
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
