/**
 * A run of line breaks a stylesheet opens with and ends on at once, under `max-empty-lines`.
 *
 * Written for #404. The check counts the empty lines of a file with two arms: one counts every break of the run the file opens with, the other adds a line to the run the file ends on. A stylesheet holding nothing but whitespace and opening with a break has one run that is both, so the two arms counted the same breaks, and the count came out a line over what the file has; the fix wrote that run as the tail of a file, which keeps a break under every option, so the warning stood after every run of `--fix`.
 *
 * The axes are what stands in front of the run — nothing, which is the shape of the issue, or a run of spaces, a tab, a free semicolon, a rule or a comment, each of which puts the run behind something and is the control — how long the run is, what splits it in two, since a run of spaces or a semicolon inside it makes two runs of one, what stands behind it, which decides where the file ends, and how its breaks are spelled.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands in front of the run: nothing, and the five things that put the run behind something. */
const HEADS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	tab: `\t`,
	semicolon: `;`,
	rule: `a {}`,
	comment: `/* c */`,
}

/** How long the run is, in breaks: one is the issue's own shape; three is over every primary measured. */
const LENGTHS: Record<string, number> = {
	one: 1,
	two: 2,
	three: 3,
}

/** What splits the run behind its first break: nothing, a run of spaces, which ends a line of its own, or a free semicolon, which PostCSS files into the same raw. */
const SPLITS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	semicolon: `;`,
}

/** What stands behind the run: nothing, a run of spaces or a tab, which the end of the file is read in front of, a free semicolon, a rule or a comment. */
const TAILS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	tab: `\t`,
	semicolon: `;`,
	rule: `a {}`,
	comment: `/* c */`,
}

/** How a break is spelled: the feed and the Windows pair. */
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

/** The rule under the primaries `scripts/oracles/options.ts` lists for it and the zero the core's own suite measures, with and without the comments passed over. */
const configs: Sweep[`configs`] = [0, 1, 2].flatMap((primary) => [{ rule: `max-empty-lines`, primary }, { rule: `max-empty-lines`, primary, secondary: { ignore: `comments` } }])

export { configs, corpus, name }
