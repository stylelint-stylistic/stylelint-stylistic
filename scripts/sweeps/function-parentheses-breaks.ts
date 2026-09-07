/**
 * Every comment kind before every break kind inside a call's parentheses, under the seven configurations of the two rules about it.
 *
 * Written for [#282](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/282) and [#321](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/321). Ten comments, since a closed `//` comment, an open one, one holding `/*` and one in a string or an address differ to a fixer; ten breaks, differing to the syntaxes; six tails, deciding whether the parser closed the call; a second prefix reaches the `-multi-line` options.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const LINE_SEPARATOR = String.fromCodePoint(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCodePoint(0x2029)
const NO_BREAK_SPACE = String.fromCodePoint(0x00a0)

const BREAKS = { lf: `\n`, cr: `\r`, crlf: `\r\n`, ff: `\f`, ls: LINE_SEPARATOR, ps: PARAGRAPH_SEPARATOR, nbsp: NO_BREAK_SPACE, space: ` `, tab: `\t`, none: `` }

const COMMENTS = { inline: `//c`, inlineThenBlockOpener: `//c/*x`, block: `/*b*/`, inlineThenBlockCloser: `//c*/`, none: ``, bareSlashes: `//`, url: `url(//x)`, string: `"//s"`, inlineThenSlash: `//c/`, slash: `/` }

const TAILS = { none: ``, block: `/*t*/`, blockOverLs: `/*t${LINE_SEPARATOR}u*/`, blockOverLf: `/*t\nu*/`, blockOpen: `/*t*`, word: `d` }

const name: Sweep[`name`] = `function-parentheses-breaks`

const corpus: Sweep[`corpus`] = place(
	multiply({ comment: COMMENTS, first: BREAKS, second: BREAKS, tail: TAILS }, ({ comment, first, second, tail }) => `translate(1px, 2px ${comment}${first}${tail}${second})`),
	{ singleLine: (value) => `a { transform: ${value}; }`, multiLine: (value) => `a { transform: 1px,\n${value}; }` },
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
