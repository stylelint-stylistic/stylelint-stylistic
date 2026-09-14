/**
 * The run in front of a closing brace that a custom property with no semicolon keeps in its value, under every reader of `getBlockAfter`.
 *
 * Written for [#538](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/538): behind a plain declaration the parser hands the trailing whitespace back to the block, behind a custom property it keeps it in the value, or in `raws.important` behind a flag, so a fix reading the run off the file and writing it into the block's `raws.after` wrote behind what it measured, and the file grew every run. The axes: what closes the block, the plain declaration and the semicolon being the controls the parser files into the block, the semicolon behind the tail so that every tail has its control; what ends the value, since the comment and the flag move the run into another raw and a `//` comment closes on the break; the run itself, in every whitespace spelling the options tell apart and two the tokenizer reads as words; and where the block stands, an at-rule and a nested rule for `indentation`, and behind a second declaration for `declaration-block-single-line-max-declarations`.
 *
 * Whitespace a reader cannot tell from a space is written as an escape.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The custom property that keeps the run, and the plain property that hands it back. */
const CLOSERS: Record<string, string> = {
	custom: `--b: red`,
	plain: `b: red`,
}

/** What ends the value: nothing, a block comment, the flag, the two together, or a `//` comment, a node to no parser inside a custom property. */
const TAILS: Record<string, string> = {
	word: ``,
	comment: ` /* c */`,
	flag: ` !important`,
	commentFlag: ` /* c */ !important`,
	inlineComment: ` // c\n`,
}

/** The tokenizer's whitespace in the spellings the options tell apart, then two characters it reads as words. */
/** The semicolon files the run into the block whatever the property; it stands behind the tail, since in front of a flag it is an unknown word. */
const SEMICOLONS: Record<string, string> = {
	none: ``,
	semicolon: `;`,
}

const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	breakOnly: `\n`,
	breakIndent: `\n\t`,
	breakSpaces: `\n  `,
	emptyLine: `\n\n`,
	twoEmptyLines: `\n\n\n`,
	spaceBreak: ` \n`,
	crlf: `\r\n`,
	noBreakSpace: `\u00A0`,
	verticalTab: `\v`,
}

const name: Sweep[`name`] = `custom-property-tail`

const corpus: Sweep[`corpus`] = place(multiply({ closer: CLOSERS, tail: TAILS, semicolon: SEMICOLONS, run: RUNS }, ({ closer, tail, semicolon, run }) => `${closer}${tail}${semicolon}${run}`), {
	rule: (body) => `a { ${body}}\n`,
	pair: (body) => `a { c: d; ${body}}\n`,
	block: (body) => `a {\n\t${body}}\n`,
	atRule: (body) => `@font-face {\n\t${body}}\n`,
	nested: (body) => `@media all {\n\ta {\n\t\t${body}}\n}\n`,
})

/** Every reader of the run: the three rules that grew, the three that were silent, and the one writing the closing run of a block it breaks up. */
const configs: Sweep[`configs`] = [
	{ rule: `block-closing-brace-newline-before`, primary: `always` },
	{ rule: `block-closing-brace-newline-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-newline-before`, primary: `never-multi-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always` },
	{ rule: `block-closing-brace-space-before`, primary: `never` },
	{ rule: `block-closing-brace-space-before`, primary: `always-single-line` },
	{ rule: `block-closing-brace-space-before`, primary: `never-single-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-space-before`, primary: `never-multi-line` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never`, secondary: { except: [`after-closing-brace`] } },
	{ rule: `max-empty-lines`, primary: 0 },
	{ rule: `max-empty-lines`, primary: 1 },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `declaration-block-single-line-max-declarations`, primary: 1 },
]

export { configs, corpus, name }
