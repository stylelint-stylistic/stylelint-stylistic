#!/usr/bin/env node

/** Asks whether every comment survives every rule's fix: a deleted one is reported nowhere; only counting finds it. */

import { stdout } from "node:process"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/** Counted apart, so one opening turning into the other counts. */
const EVERY_BLOCK_OPENING = /\/\*/gu
const EVERY_INLINE_OPENING = /\/\//gu

/**
 * Counts the openings.
 * @param text - The stylesheet whose openings are counted.
 * @returns The tally.
 */
function tally (text: string): string {
	return `block:${(text.match(EVERY_BLOCK_OPENING) ?? []).length} inline:${(text.match(EVERY_INLINE_OPENING) ?? []).length}`
}

/**
 * Fixes a fixture and compares tallies.
 * @param run - The fixture and the config to lint it under.
 * @returns The finding.
 */
async function probe (run: Run): Promise<object | null> {
	let before = tally(run.code)

	if (before === `block:0 inline:0`) return null

	let result

	try {
		result = await lint({ code: run.code, config: run.config, fix: true })
	}
	catch {
		return null
	}

	let [first] = result.results

	if (!isUsable(first)) return null

	let output = result.code ?? run.code
	let after = tally(output)

	if (after === before) return null

	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name, before, after, code: run.code, output }
}

let findings: object[] = []

for (let run of buildRuns()) {
	// eslint-disable-next-line no-await-in-loop
	let finding = await probe(run)

	if (finding) findings.push(finding)
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
