/**
 * A block holding nothing but comments, under every primary of the four rules that read the run in front of its closing brace.
 *
 * Written for [#676](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/676): such a block has no non-comment node, so the run `block-opening-brace-newline-after` reads is the block's own trailing raw, which the three `block-closing-brace-*-before` rules write. The oracle corpora carry no such block, and a sweep runs one rule at a time, so the three neighbours are listed to show that none of their rows moves.
 *
 * The axes: the run behind the opening brace, since a break there is carried past the comments onto the brace; what the block holds, an inline comment among it, which only the preprocessors read as a comment; and the run in front of the closing brace, a stray semicolon in it being the character the four rules read differently from one another.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run behind the opening brace. */
const HEADS = { none: ``, space: ` `, lineBreak: `\n`, breakThenTab: `\n\t`, spaceThenBreak: ` \n` }

/** What the block holds; the inline comment is a comment to the preprocessors alone. */
const BODIES = {
	comment: `/*c*/`,
	twoOnALine: `/*1*/ /*2*/`,
	twoOverTwoLines: `/*1*/\n/*2*/`,
	multiLine: `/*a\nb*/`,
	inline: `//c\n`,
}

/** The run in front of the closing brace; the last two hold a stray semicolon, which no fix writes over. */
const TAILS = { none: ``, space: ` `, lineBreak: `\n`, spaceThenBreak: ` \n`, twoBreaks: `\n\n`, semicolon: `;`, semicolonInARun: ` ; ` }

const name: Sweep[`name`] = `comment-only-block`

const corpus: Sweep[`corpus`] = place(
	multiply({ head: HEADS, body: BODIES, tail: TAILS }, ({ head, body, tail }) => `${head}${body}${tail}`),
	{
		rule: (block) => `a {${block}}\n`,
		atRule: (block) => `@media (x) {${block}}\n`,
		nested: (block) => `@media (x) {\n\ta {${block}}\n}\n`,
	},
)

const configs: Sweep[`configs`] = [
	{ rule: `block-opening-brace-newline-after`, primary: `always` },
	{ rule: `block-opening-brace-newline-after`, primary: `always-multi-line` },
	{ rule: `block-opening-brace-newline-after`, primary: `never-multi-line` },
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
]

export { configs, corpus, name }
