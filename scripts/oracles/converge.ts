#!/usr/bin/env node

/**
 * Asks of every rule, primary and fixture whether `--fix` converges and its output parses; `testRule` runs the fixer once and cannot see [#131](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131), [#196](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196) or [#239](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/239).
 *
 * Rows: `broke` (no parse), `not-idempotent` (run two wrote) and `diverges` (run three wrote).
 */

import { stdout } from "node:process"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/**
 * Names a run without its configuration.
 * @param run - The rule, primary, syntax and fixture named.
 * @returns Its four identifying fields.
 */
function label (run: Run): object {
	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name }
}

/**
 * Runs the fixer three times over one fixture.
 * @param run - The rule, primary, syntax and fixture probed.
 * @returns The finding, or null.
 */
async function probe (run: Run): Promise<object | null> {
	let history = [run.code]
	let current = run.code

	for (let pass = 0; pass < 3; pass += 1) {
		let result

		try {
			// Each run reads what the one before wrote
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
