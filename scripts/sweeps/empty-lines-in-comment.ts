/**
 * A comment standing inside a call `function-max-empty-lines` reads, holding empty lines, a parenthesis or the opening of a call of its own, beside the empty lines the call itself holds.
 *
 * Written for #503. The rule used to read a call as one string, comments and all: it counted the runs of line breaks over the whole of that text and rewrote the whole of it, so the empty lines a comment held were the call's to it, and `--fix` collapsed them inside the comment's own text. What a comment is spelled with made no difference, since the text was never asked about its comments at all.
 *
 * The axis the corpus is built on is what the comment holds, which is what no earlier sweep put inside one — `slash-star-slash`, written for #378, put a violation inside a comment beside the same violation as code, and the empty lines it wrote there were the ones the call held all along. Beside that stands where the comment is written and what the call holds of its own, since a call whose own empty lines the rule must still collapse is the other half of the answer, and the spelling of the comment, since a comment opening `/*\/` closes on its own star to `postcss-value-parser` and a double slash opens no comment the parser knows at all.
 *
 * The line breaks are spelled three ways because the fix runs two passes, one for each spelling, and the second reads what the first wrote: a run of the Windows pair around bare feeds is where the two meet. The comment's run and the call's own are spelled apart, so that the pass which finds one is not always the pass which finds the other.
 *
 * The controls are the same text with no comment around it, where the rule reads code and nothing else, and the comment holding nothing a rule or a parser could act on.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** How a run of line breaks long enough to violate either option is spelled: the feed alone, the Windows pair, and the two mixed, which is the run the fix's second pass only ever meets because its first pass wrote it. Read twice over, once for the run the comment holds and once for the run the call holds outside it. */
const RUNS: Record<string, string> = {
	lf: `\n\n\n`,
	crlf: `\r\n\r\n\r\n`,
	mixed: `\r\n\n\n\r\n`,
}

/** What the comment holds: empty lines of its own, a call holding them, a parenthesis that would close the call the comment stands in, that parenthesis with empty lines behind it, the opening of a call, and text no reader of a value acts on. */
const TEXTS: Record<string, (run: string) => string> = {
	emptyLines: (run) => run,
	callWithEmptyLines: (run) => `g(1,${run}2)`,
	closingParenthesis: () => `)`,
	closingParenthesisWithEmptyLines: (run) => `)${run}`,
	callOpening: () => `g(`,
	plainText: () => `x`,
}

/** How the comment is spelled around its text: the block comment CSS reads, the one opening `/*\/`, which the value parser closes on the star it opened with, the double slash a preprocessor reads and plain CSS does not, and no comment at all, which is the control. */
const SPELLINGS: Record<string, (text: string) => string> = {
	block: (text) => `/* ${text} */`,
	slashStarSlash: (text) => `/*/ ${text} */`,
	inline: (text) => `// ${text}`,
	none: (text) => text,
}

/** Where the comment stands, and what empty lines the call holds without it: first, last and between the arguments of a call holding none, the same call holding a run in front of the comment, behind it, and on both sides of it, the comment inside a nested call, and the comment outside the call altogether. The run handed here is the call's own, which is spelled apart from the one the comment holds. */
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

/**
 * Names the keys of a record as an axis whose values are the keys themselves, for a template to look the record up by.
 * @param record - The record.
 * @returns The keys, each under itself.
 */
function keysOf (record: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(Object.keys(record).map((key) => [key, key]))
}

const name: Sweep[`name`] = `empty-lines-in-comment`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), spelling: keysOf(SPELLINGS), text: keysOf(TEXTS), commentRun: RUNS, callRun: RUNS }, ({ place, spelling, text, commentRun, callRun }) => {
	let wrap = PLACES[place ?? ``]
	let spell = SPELLINGS[spelling ?? ``]
	let hold = TEXTS[text ?? ``]

	if (!wrap || !spell || !hold || commentRun === undefined || callRun === undefined) throw new Error(`Every axis names a value`)

	return wrap(spell(hold(commentRun)), callRun)
})

/** The rule under both primary options `scripts/oracles/options.ts` lists for it. */
const configs: Sweep[`configs`] = [0, 1].map((primary) => ({ rule: `function-max-empty-lines`, primary }))

export { configs, corpus, name }
