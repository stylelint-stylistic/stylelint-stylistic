#!/usr/bin/env node

/**
 * Asks of every rule under every primary option whether every declaration, rule and at-rule survives the fix.
 *
 * The mirror of `comments.ts`: code swallowed into a surviving comment moves no comment count ([#248](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/248)). Nodes, not characters: a fixer may remove a character, but no stylistic rule removes a node.
 */

import { stdout } from "node:process"

import postcss, { type Parser } from "postcss"
import less from "postcss-less"
import scss from "postcss-scss"

import { lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/** The parser each syntax is read back with. */
const PARSERS: Record<string, { parse: Parser }> = { css: postcss, less, scss }

/**
 * Counts the declarations, rules and at-rules.
 * @param code - The stylesheet.
 * @param syntaxName - The name the parser is looked up by: `css`, `less` or `scss`.
 * @returns A comparable key, or null where the text does not parse.
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
 * Fixes one fixture and compares the counts.
 * @param run - One rule under one primary option over one fixture.
 * @returns The finding, or null.
 */
async function probe (run: Run): Promise<object | null> {
	let before = tally(run.code, run.syntaxName)

	// Nothing to ask of unparsable or empty input
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

	// Output that no longer parses is `converge.ts`'s finding
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
