#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option it accepts: does every declaration, rule and at-rule the file held survive the fix?
 *
 * This is the mirror image of `comments.ts`, and the half of the question that oracle cannot ask. That one counts the comment openings a file holds, so it catches a comment a fixer deleted; the opposite failure is code a fixer swallowed *into* a comment that survives, and to a count of comments nothing has happened at all. Nothing else sees it either: the output parses, since a commented-out declaration leaves a stylesheet every parser is happy with, and the run after it is stable. #248 is that shape, and `converge.ts` reports no row for either of its rules.
 *
 * What is counted is nodes rather than characters. A fixer may take a character away and be right to — `no-extra-semicolons` removes a stray semicolon, `number-no-trailing-zeros` a zero, `declaration-block-trailing-semicolon` under `never` the last semicolon of a block — and none of those is a node. No stylistic rule adds or removes a declaration, a rule or an at-rule, so any change in those three counts is a fixer carrying code off.
 */

import { stdout } from "node:process"

import postcss, { type Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/** The parser each syntax of a run is read back with, so that what came out of the fix is counted the way what went in was written. */
const PARSERS: Record<string, { parse: Parser }> = { css: postcss, less, scss }

/**
 * Counts the declarations, rules and at-rules a stylesheet holds.
 * @param code - The stylesheet to count in.
 * @param syntaxName - The syntax it is written in.
 * @returns The tally, as a key two stylesheets can be compared by, or null where the text does not parse.
 */
function tally (code: string, syntaxName: string): string | null {
	let counts = { decl: 0, rule: 0, atrule: 0 }

	try {
		let parser = PARSERS[syntaxName]

		if (!parser) return null

		parser.parse(code).walk(({ type }) => {
			if (type === `decl` || type === `rule` || type === `atrule`) counts[type] += 1
		})
	}
	catch {
		return null
	}

	return `decl:${counts.decl} rule:${counts.rule} atrule:${counts.atrule}`
}

/**
 * Fixes one fixture and counts what came out against what went in.
 * @param run - The rule, the option, the syntax and the fixture.
 * @returns The finding, or null where there is none.
 */
async function probe (run: Run): Promise<object | null> {
	let before = tally(run.code, run.syntaxName)

	// A fixture the syntax cannot read is no fixture, and one holding nothing to lose is nothing to ask about
	if (before === null || before === `decl:0 rule:0 atrule:0`) return null

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
	let after = tally(output, run.syntaxName)

	// Output that no longer parses is `converge.ts`'s finding rather than this one's, and reporting it here would say the same thing twice
	if (after === null || after === before) return null

	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name, before, after, code: run.code, output }
}

let findings: object[] = []

for (let run of buildRuns()) {
	// eslint-disable-next-line no-await-in-loop
	let finding = await probe(run)

	if (finding) findings.push(finding)
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
