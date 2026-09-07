#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option, whether a `//` comment moves a warning against a block comment of the same width in its place.
 *
 * The two files hold the same code in the same columns, so any disagreement is the comment's ([#139](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139)). Warnings only: declining to write into a comment differs from the twin on purpose.
 */

import { stdout } from "node:process"

import { type Config, lint } from "../harness/lint.ts"

import { buildRuns, type Run } from "./runs.ts"

/** The two comments, spelled so that neither is read as a comment of this file. */
const INLINE_COMMENT = `//${` `}c`
const BLOCK_COMMENT = `/${`*`.repeat(2)}/`

/** The shapes a comment can stand in; the last two ([#139](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139)) reach `at-rule-semicolon-space-before` and put the closing break where a rule counting past it lands on the next line. */
const CORPUS: [string, string][] = [
	[`value-continues`, `a { b: 1px ${INLINE_COMMENT}\n\t2px; }\n`],
	[`value-ends-block`, `a {\n\tcolor: pink ${INLINE_COMMENT}\n}\n`],
	[`decl-then-decl`, `a {\n\tcolor: pink ${INLINE_COMMENT}\n\tcolor: red;\n}\n`],
	[`semicolon-next-line`, `a {\n\tcolor: red ${INLINE_COMMENT}\n\t;\n}\n`],
	[`func-argument`, `a { t: translate(1px, 2px ${INLINE_COMMENT}\n\t); }\n`],
	[`media-feature`, `@media (min-width: 100px ${INLINE_COMMENT}\n\t) { a { color: red; } }\n`],
	[`atrule-params`, `@media screen ${INLINE_COMMENT}\n\t{ a { color: red; } }\n`],
	[`selector`, `a ${INLINE_COMMENT}\n{ color: pink; }\n`],
	[`comment-node`, `a {\n\tcolor: pink;\n\t${INLINE_COMMENT}\n}\n`],
	[`nested-block`, `a {\n\tb {\n\t\tcolor: pink ${INLINE_COMMENT}\n\t}\n}\n`],
	[`bang`, `a {\n\tcolor: red !important ${INLINE_COMMENT}\n\t;\n}\n`],
	[`two-comments`, `a { b: 1px ${INLINE_COMMENT}\n\t2px ${INLINE_COMMENT}\n\t3px; }\n`],
	[`bodiless-at-rule`, `@import "a" ${INLINE_COMMENT}\n\t;\n`],
	[`at-rule-in-block`, `a {\n\t@include x ${INLINE_COMMENT}\n\t;\n}\n`],
	[`at-rule-params-continue`, `@import "a" ${INLINE_COMMENT}\n\t"b" ;\n`],
	[`semicolon-then-decl`, `a { color: red ${INLINE_COMMENT}\n;\ntop: 0;\n}\n`],
]

/**
 * Lints one snippet.
 * @param code - The snippet.
 * @param config - The Stylelint configuration.
 * @returns The warnings with positions.
 */
async function warningsOf (code: string, config: Config): Promise<string[]> {
	let result = await lint({ code, config, fix: false })

	return result.results[0].warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`)
}

/**
 * Lints a fixture in both spellings.
 * @param run - The rule, option, syntax and fixture.
 * @returns The finding, or null where they agree.
 */
async function probe (run: Run): Promise<object | null> {
	let inline
	let block

	try {
		inline = await warningsOf(run.code, run.config)
		block = await warningsOf(run.code.replaceAll(INLINE_COMMENT, BLOCK_COMMENT), run.config)
	}
	catch {
		return null
	}

	if ([...inline, ...block].some((warning) => warning.includes(`CssSyntaxError`))) return null
	if (inline.join(`|`) === block.join(`|`)) return null

	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name, inline, block }
}

let findings: object[] = []

for (let run of buildRuns(CORPUS)) {
	// eslint-disable-next-line no-await-in-loop
	let finding = await probe(run)

	if (finding) findings.push(finding)
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
