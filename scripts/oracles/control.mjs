#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option it accepts: does a `//` comment move a warning, against a block comment of exactly the same width standing in its place?
 *
 * Every fixture is written with an inline comment four characters wide, so that a block comment stands in it character for character and the two files hold the same code on the same lines in the same columns. Any disagreement is the comment's doing, and it is the whole of #139 and of half a dozen issues before it.
 *
 * The run reports warnings only, with no fixing: a rule that correctly declines to write into a comment differs from its block-comment twin on purpose, and comparing the two outputs would say so on every guarded rule. What it says nothing about is the column the warning came out at.
 */

import { stdout } from "node:process"

import { lint } from "../harness/lint.mjs"

import { buildRuns } from "./runs.mjs"

/** The inline comment every fixture is written with, and the block comment of exactly its width that stands in its place. Both are spelled out of the source of this file, so that nothing here is read as a comment of its own. */
const INLINE_COMMENT = `//${` `}c`
const BLOCK_COMMENT = `/${`*`.repeat(2)}/`

/** The shapes a comment can stand in, each of them the same code whichever way the comment is spelled. */
const CORPUS = [
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
]

/**
 * Lints one snippet and hands back what it said.
 * @param {string} code - The snippet.
 * @param {object} config - The Stylelint configuration.
 * @returns {Promise<string[]>} The warnings, each with its position.
 */
async function warningsOf (code, config) {
	let result = await lint({ code, config, fix: false })

	return result.results[0].warnings.map((warning) => `${warning.line}:${warning.column} ${warning.text}`)
}

/**
 * Lints one fixture in both of its spellings and compares what each one drew.
 * @param {import('./runs.mjs').Run} run - The rule, the option, the syntax and the fixture.
 * @returns {Promise<object | null>} The finding, or null where the two agree.
 */
async function probe (run) {
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

let findings = []

for (let run of buildRuns(CORPUS)) {
	// eslint-disable-next-line no-await-in-loop
	let finding = await probe(run)

	if (finding) findings.push(finding)
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
