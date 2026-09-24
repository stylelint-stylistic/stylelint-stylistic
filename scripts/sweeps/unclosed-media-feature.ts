/**
 * A media feature the file never closes, in every place such a feature stands, holding every kind of node, behind every spelling of the run its `(` opens on, and in front of every tail the file may end in.
 *
 * PostCSS reads an at-rule's params past every brace while a `(` is open, so the value parser hands back an unclosed node holding the rest of the file, and no oracle carries the shape — `converge` reports nothing over a base where `always` writes a space at the end of the file every run. The closed features are the control set, expected to move only where what they hold leaves them open.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Every spelling of the run behind the `(`, which is the one side the rule could still read of an unclosed feature. */
const RUNS: Record<string, string> = {
	empty: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	lineFeed: `\n`,
	breakThenSpaces: `\n  `,
}

/** What the feature holds: a plain value, a closed and an unclosed call, a closed and an unclosed address, a string and a comment holding a parenthesis, an inline comment, and nothing. */
const HOLDS: Record<string, string> = {
	value: `a: 1`,
	closedCall: `a: calc(1px)`,
	unclosedCall: `a: calc(1px`,
	closedAddress: `a: url(b.png)`,
	unclosedAddress: `a: url( b.png`,
	parenthesisInString: `a: ")"`,
	parenthesisInComment: `a: 1 /* ) */`,
	inlineComment: `a: 1 // c`,
	nothing: ``,
}

/** Where the feature stands: alone, behind a feature the file does close, in a list behind one, and closed, which is the control where what it holds closes what it opens; an unclosed call or address inside leaves the feature open behind the parenthesis written to close it, and under `postcss-scss` an inline comment carries that parenthesis out of the params. */
const PLACES: Record<string, (run: string, hold: string, tail: string) => string> = {
	alone: (run, hold, tail) => `@media (${run}${hold}${tail}`,
	behindClosed: (run, hold, tail) => `@media (b: 2) and (${run}${hold}${tail}`,
	inList: (run, hold, tail) => `@media (b: 2), (${run}${hold}${tail}`,
	closed: (run, hold, tail) => `@media (${run}${hold})${tail}`,
}

/** What the file ends in behind the feature: a block on one line, a block over several, a block with no break behind it, one with a space behind it, and no block at all. */
const TAILS: Record<string, string> = {
	block: ` { a { b: c; } }\n`,
	multiLineBlock: ` {\n\ta {\n\t\tb: c;\n\t}\n}\n`,
	unterminatedBlock: ` { a { b: c; } }`,
	spaceBehindBlock: ` { a { b: c; } } \n`,
	noBlock: `\n`,
}

const name: Sweep[`name`] = `unclosed-media-feature`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), hold: keysOf(HOLDS), run: keysOf(RUNS), tail: keysOf(TAILS) }, ({ place, hold, run, tail }) => {
	let wrap = PLACES[place ?? ``]
	let held = HOLDS[hold ?? ``]
	let text = RUNS[run ?? ``]
	let end = TAILS[tail ?? ``]

	if (!wrap || held === undefined || text === undefined || end === undefined) throw new Error(`Every axis names a value`)

	return wrap(text, held, end)
})

/** The rule the runaway stands on, under both of its options. */
const configs: Sweep[`configs`] = [`always`, `never`].map((primary) => ({ rule: `media-feature-parentheses-space-inside`, primary }))

export { configs, corpus, name }
