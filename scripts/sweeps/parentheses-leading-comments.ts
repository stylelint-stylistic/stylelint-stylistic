/**
 * Two comments and the runs around them standing between a call's opening parenthesis and its first argument, under the seven configurations of the two rules about those parentheses.
 *
 * Written for [#505](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/505). The corpus of `function-parentheses-breaks` puts its comment behind the second argument alone, so the opening walk never reaches one; here both places are a comment, since it is the pairing that moves the walk — the value parser hangs the run in front of a `/` on the slash itself, so an end-of-line comment behind another comment opens a node standing in front of its own span. Four comment spellings, six runs between them, four behind the second and four arguments; a `/*\/` comment is the spelling the parser closes three characters in, and a vertical tab is the character the value parser calls whitespace and the tokenizer a word.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const COMMENTS = { none: ``, block: `/*b*/`, inline: `//c`, slashStarSlash: `/*/b*/` }

const VERTICAL_TAB = String.fromCodePoint(0x0b)

const GAPS = { none: ``, space: ` `, tab: `\t`, lineBreak: `\n `, verticalTab: VERTICAL_TAB, spaceThenVerticalTab: ` ${VERTICAL_TAB} ` }

const RUNS = { none: ``, space: ` `, lineBreak: `\n `, spaceThenBreak: ` \n ` }

const TAILS = { none: ``, word: `2`, wordThenBreak: `2\n`, list: `2, 3` }

const name: Sweep[`name`] = `parentheses-leading-comments`

const corpus: Sweep[`corpus`] = place(
	multiply({ first: COMMENTS, gap: GAPS, second: COMMENTS, run: RUNS, tail: TAILS }, ({ first, gap, second, run, tail }) => `f(${first}${gap}${second}${run}${tail})`),
	{ declaration: (value) => `a { b: ${value}; }\n` },
)

const configs: Sweep[`configs`] = [
	{ rule: `function-parentheses-space-inside`, primary: `always` },
	{ rule: `function-parentheses-space-inside`, primary: `never` },
	{ rule: `function-parentheses-space-inside`, primary: `always-single-line` },
	{ rule: `function-parentheses-space-inside`, primary: `never-single-line` },
	{ rule: `function-parentheses-newline-inside`, primary: `always` },
	{ rule: `function-parentheses-newline-inside`, primary: `always-multi-line` },
	{ rule: `function-parentheses-newline-inside`, primary: `never-multi-line` },
]

export { configs, corpus, name }
