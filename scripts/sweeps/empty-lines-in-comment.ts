/**
 * A comment inside a call `function-max-empty-lines` reads, beside the call's own empty lines. Written for [#503](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/503): the rule read a call as one string, so `--fix` collapsed the empty lines inside a comment.
 *
 * The main axis is what the comment holds, which no earlier sweep varied (`slash-star-slash`, [#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)). The others are where the comment stands, what the call holds, and the comment's spelling: `/*\/` closes on its own star to `postcss-value-parser`, and `//` opens no comment it knows. Breaks are spelled three ways because the fix runs a pass per spelling and the second reads what the first wrote.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** A run violating either option; the mixed one is what the fix's second pass meets after its first. */
const RUNS: Record<string, string> = {
	lf: `\n\n\n`,
	crlf: `\r\n\r\n\r\n`,
	mixed: `\r\n\n\n\r\n`,
}

/** What the comment holds: empty lines, a call holding them, a `)`, a `)` with empty lines behind it, a call opening, and inert text. */
const TEXTS: Record<string, (run: string) => string> = {
	emptyLines: (run) => run,
	callWithEmptyLines: (run) => `g(1,${run}2)`,
	closingParenthesis: () => `)`,
	closingParenthesisWithEmptyLines: (run) => `)${run}`,
	callOpening: () => `g(`,
	plainText: () => `x`,
}

/** The comment's spelling; `none` is the control. */
const SPELLINGS: Record<string, (text: string) => string> = {
	block: (text) => `/* ${text} */`,
	slashStarSlash: (text) => `/*/ ${text} */`,
	inline: (text) => `// ${text}`,
	none: (text) => text,
}

/** Where the comment stands; the run handed here is the call's own. */
const PLACES: Record<string, (comment: string, run: string) => string> = {
	callFirst: (comment) => `a { b: f(${comment} 1, 2); }\n`,
	callMiddle: (comment) => `a { b: f(1, ${comment} 2); }\n`,
	callLast: (comment) => `a { b: f(1, 2 ${comment}); }\n`,
	callRunInFront: (comment, run) => `a { b: f(1,${run}${comment} 2); }\n`,
	callRunBehind: (comment, run) => `a { b: f(1, ${comment}${run}2); }\n`,
	callRunBothSides: (comment, run) => `a { b: f(1,${run}${comment}${run}2); }\n`,
	nested: (comment) => `a { b: f(g(1, ${comment} 2)); }\n`,
	outside: (comment, run) => `a { b: ${comment} f(1,${run}2); }\n`,
}

const name: Sweep[`name`] = `empty-lines-in-comment`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), spelling: keysOf(SPELLINGS), text: keysOf(TEXTS), commentRun: RUNS, callRun: RUNS }, ({ place, spelling, text, commentRun, callRun }) => {
	let wrap = PLACES[place ?? ``]
	let spell = SPELLINGS[spelling ?? ``]
	let hold = TEXTS[text ?? ``]

	if (!wrap || !spell || !hold || commentRun === undefined || callRun === undefined) throw new Error(`Every axis names a value`)

	return wrap(spell(hold(commentRun)), callRun)
})

/** The rule under both primary options. */
const configs: Sweep[`configs`] = [0, 1].map((primary) => ({ rule: `function-max-empty-lines`, primary }))

export { configs, corpus, name }
