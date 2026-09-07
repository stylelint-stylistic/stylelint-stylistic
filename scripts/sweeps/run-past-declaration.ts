/**
 * The whitespace behind the colon of a declaration that prints nothing there and has no semicolon, so the run stands in the raw of what comes next.
 *
 * Written for [#387](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387): both `declaration-colon-*-after` rules read the declaration to the end of its value, and the run has left it for the next node's `raws.before` or the block's `raws.after`. The run is put in every raw it can reach, in every whitespace spelling and two the tokenizer reads as words, in a rule, a nested rule, an at-rule and a Sass nested property; the custom property, the `!important` flag and the semicolon are controls keeping it inside the declaration. The `block-closing-brace-*-before` rules read the same run and `declaration-block-trailing-semicolon` moves the boundary. `root` and `rootBreak` came with [#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537): the root's `raws.after` is the file's tail, which `no-missing-end-of-source-newline` writes.
 *
 * Whitespace a reader cannot tell from a space is written as an escape.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The tokenizer's whitespace, then two characters it reads as words. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	breakOnly: `\n`,
	breakIndent: `\n\t`,
	crlf: `\r\n`,
	bareReturn: `\r`,
	formFeed: `\f`,
	verticalTab: `\v`,
	noBreakSpace: `\u00A0`,
}

/** What claims the run: the brace, comments, a `//` comment (a node to `postcss-scss`, a value word to the others), or the semicolon that keeps it in the declaration. */
const TAILS: Record<string, string> = {
	brace: ``,
	comment: `/*c*/`,
	twoComments: `/*c*/ /*d*/`,
	inlineComment: `//c\n`,
	semicolon: `;`,
}

/** Only the last declaration's run is read. */
const HEADS: Record<string, string> = {
	alone: ``,
	afterDeclaration: `c: red; `,
}

/** A custom property's whitespace-only value stays in `decl.value`. */
const PROPERTIES: Record<string, string> = {
	plain: `b`,
	custom: `--b`,
}

/** The flag keeps the run inside the declaration. */
const FLAGS: Record<string, string> = {
	none: ``,
	important: `!important`,
}

const name: Sweep[`name`] = `run-past-declaration`

const corpus: Sweep[`corpus`] = place(multiply({ head: HEADS, property: PROPERTIES, run: RUNS, flag: FLAGS, tail: TAILS }, ({ head, property, run, flag, tail }) => `${head}${property}:${run}${flag}${tail}`), {
	rule: (body) => `a { ${body}}\n`,
	nested: (body) => `@media all {\n\ta { ${body}}\n}\n`,
	atRule: (body) => `@font-face { ${body}}\n`,
	sassProperty: (body) => `a { font: 2px/3px { ${body}} }\n`,
	root: (body) => body,
	rootBreak: (body) => `${body}\n`,
})

/** The issue's rules, the two reading the run from the brace, the one moving the semicolon boundary, and the one writing the file's tail. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-colon-space-after`, primary: `always` },
	{ rule: `declaration-colon-space-after`, primary: `never` },
	{ rule: `declaration-colon-space-after`, primary: `always-single-line` },
	{ rule: `declaration-colon-newline-after`, primary: `always` },
	{ rule: `declaration-colon-newline-after`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always` },
	{ rule: `block-closing-brace-space-before`, primary: `never` },
	{ rule: `block-closing-brace-newline-before`, primary: `always` },
	{ rule: `block-closing-brace-newline-before`, primary: `never-multi-line` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `never` },
	{ rule: `no-missing-end-of-source-newline`, primary: true },
]

export { configs, corpus, name }
