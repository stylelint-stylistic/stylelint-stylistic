#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option it accepts: does every comment the file held survive the fix?
 *
 * A comment a fixer deletes is the quietest failure the plugin has — nothing is reported, the output parses, and the run after it is stable. It is found by counting, and by nothing else.
 */

import { stdout } from "node:process"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/** Every opening a comment can be spelled with, counted apart so that one kind turning into the other is a finding too. */
const EVERY_BLOCK_OPENING = /\/\*/gu
const EVERY_INLINE_OPENING = /\/\//gu

/**
 * Counts the comment openings a text holds.
 * @param text - The text to count in.
 * @returns The tally, as a key two texts can be compared by.
 */
function tally (text: string): string {
	return `block:${(text.match(EVERY_BLOCK_OPENING) ?? []).length} inline:${(text.match(EVERY_INLINE_OPENING) ?? []).length}`
}

/**
 * Fixes one fixture and counts what came out against what went in.
 * @param run - The rule, the option, the syntax and the fixture.
 * @returns The finding, or null where there is none.
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
