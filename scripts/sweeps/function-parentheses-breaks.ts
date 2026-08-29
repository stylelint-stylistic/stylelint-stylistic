/**
 * A comment of every kind in front of a break of every kind, inside the parentheses of a call, under the seven configurations of the two rules about the whitespace inside those parentheses.
 *
 * Written for #282 and #321 and carried since, so that no later fix can move a break or a comment there without a row saying so. Ten comments, since a `//` comment closed by the parser, one left open, one holding a block comment's opener and one standing in a string or an address are all different things to a fixer; ten breaks, since a line feed, a carriage return, a Windows pair, a form feed, the two Unicode separators and a plain space are all different things to the syntaxes; and six tails, since what stands behind the break decides whether the parser has closed the call at all. A second prefix puts the same call on two lines, so that the `-multi-line` options are reached.
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
