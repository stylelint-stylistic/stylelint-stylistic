/**
 * A run of line breaks a stylesheet opens with and ends on at once, under `max-empty-lines`.
 *
 * Written for [#404](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404): the check counted the opening run and the closing one apart, a line over, and the fix wrote the run as a tail, which keeps a break, so the warning survived every `--fix`. The axes: what stands in front (nothing is the issue's shape), the run's length, what splits it, what follows, and the break's spelling.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands in front of the run. */
const HEADS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	tab: `\t`,
	semicolon: `;`,
	rule: `a {}`,
	comment: `/* c */`,
}

/** Three is over every primary. */
const LENGTHS: Record<string, number> = {
	one: 1,
	two: 2,
	three: 3,
}

/** What splits the run; a free semicolon lands in the same raw. */
const SPLITS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	semicolon: `;`,
}

/** What stands behind the run. */
const TAILS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	tab: `\t`,
	semicolon: `;`,
	rule: `a {}`,
	comment: `/* c */`,
}

/** The break's spelling. */
const BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `whitespace-only-root`

const corpus: Sweep[`corpus`] = multiply({ head: keysOf(HEADS), length: keysOf(LENGTHS), split: keysOf(SPLITS), tail: keysOf(TAILS), lineBreak: keysOf(BREAKS) }, ({ head, length, split, tail, lineBreak }) => {
	let front = HEADS[head ?? ``]
	let breaks = LENGTHS[length ?? ``]
	let between = SPLITS[split ?? ``]
	let back = TAILS[tail ?? ``]
	let spelling = BREAKS[lineBreak ?? ``]

	if (front === undefined || breaks === undefined || between === undefined || back === undefined || spelling === undefined) throw new Error(`Every axis names a value`)

	return `${front}${spelling}${between}${spelling.repeat(breaks - 1)}${back}`
})

/** The listed primaries and zero, with and without `ignore: comments`. */
const configs: Sweep[`configs`] = [0, 1, 2].flatMap((primary) => [{ rule: `max-empty-lines`, primary }, { rule: `max-empty-lines`, primary, secondary: { ignore: `comments` } }])

export { configs, corpus, name }
