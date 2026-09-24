/**
 * The lineness of a custom property closing a block, or the stylesheet, with no semicolon behind it, under the two `declaration-colon-*-after` rules.
 *
 * Behind such a property the parser keeps the run in front of the closing brace, or the file's end, in the value, and the `-single-line` and `-multi-line` options counted the block's break as a line of the declaration. The axes: the property, the plain one whose run the parser files into the block being the control; the run behind the colon, in the spellings the options tell apart; what the value is, a word, nothing, a comment with a break inside or none, a `//` comment, the flag, and a value broken across lines of its own; the semicolon, whose presence makes the run the semicolon's; the run in front of the brace, in every spelling the options tell apart; and where the declaration stands, a block on several lines, a block on one, and the root.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The custom property, whose trailing run the parser keeps, and the plain one, whose run it files into the block. */
const PROPERTIES: Record<string, string> = {
	custom: `--b`,
	plain: `b`,
}

/** The run behind the colon, in the spellings the options tell apart. */
const COLON_RUNS: Record<string, string> = {
	abutting: ``,
	space: ` `,
	twoSpaces: `  `,
	lineBreak: `\n`,
}

/** What the value is; the `//` comment is a comment closing on the break to `postcss-scss`, and a word of the value to plain CSS and to `postcss-less` inside a custom property. */
const VALUES: Record<string, string> = {
	word: `red`,
	nothing: ``,
	comment: `red /*c*/`,
	brokenComment: `red /*c\n*/`,
	inlineComment: `red // c`,
	flag: `red !important`,
	broken: `red,\n\t\tblue`,
}

/** The semicolon, behind which the run is the semicolon's. */
const SEMICOLONS: Record<string, string> = {
	none: ``,
	semicolon: `;`,
}

/** The run in front of the closing brace, in the spellings the options tell apart. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	lineBreak: `\n`,
	breakIndent: `\n\t`,
	emptyLine: `\n\n`,
}

const name: Sweep[`name`] = `custom-property-lineness`

const corpus: Sweep[`corpus`] = place(multiply({ property: PROPERTIES, colonRun: COLON_RUNS, value: VALUES, semicolon: SEMICOLONS, run: RUNS }, ({ property, colonRun, value, semicolon, run }) => `${property}:${colonRun}${value}${semicolon}${run}`), {
	block: (body) => `a {\n\t${body}}\n`,
	oneLine: (body) => `a { ${body}}\n`,
	root: (body) => body,
})

/** The two rules under every primary, then the controls: the colon rule with no lineness option, and the two semicolon rules whose lineness is the block's. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-colon-newline-after`, primary: `always` },
	{ rule: `declaration-colon-newline-after`, primary: `always-multi-line` },
	{ rule: `declaration-colon-space-after`, primary: `always` },
	{ rule: `declaration-colon-space-after`, primary: `never` },
	{ rule: `declaration-colon-space-after`, primary: `always-single-line` },
	{ rule: `declaration-colon-space-before`, primary: `always` },
	{ rule: `declaration-colon-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always-multi-line` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always-single-line` },
]

export { configs, corpus, name }
