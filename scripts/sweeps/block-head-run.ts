/**
 * The run of line breaks a styled template opens with, behind the backtick the host code stands in front of.
 *
 * `max-empty-lines` counted that run as a file's, where the first break closes an empty line, although here it closes the host's own line; the warning it added was one the fix then wrote away, joining the first node onto the host's line. The axes: the run's length, what splits it, what follows it inside the template, what closes the template, and the break's spelling. A template opening on its first node is the control, holding no such run.
 *
 * The rules are the three that write the head raw of a root and `indentation`, which reads the run in front of a node as its level.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run's length; behind a backtick a run of four breaks is over every primary here, since its first closes the host's own line, and zero is the control. */
const LENGTHS: Record<string, number> = {
	none: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
}

/** What splits the run; a free semicolon lands in the same raw. */
const SPLITS: Record<string, string> = {
	nothing: ``,
	spaces: `   `,
	semicolon: `;`,
}

/** What the template holds behind the run. */
const BODIES: Record<string, string> = {
	declaration: `color: red;`,
	rule: `a { color: red; }`,
	comment: `/* c */`,
	nothing: ``,
}

/** What closes the template in front of the backtick. */
const TAILS: Record<string, string> = {
	nothing: ``,
	singleBreak: `\n`,
	run: `\n\n\n`,
}

/** The break's spelling. */
const BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `block-head-run`

const corpus: Sweep[`corpus`] = multiply({ length: keysOf(LENGTHS), split: keysOf(SPLITS), body: keysOf(BODIES), tail: keysOf(TAILS), lineBreak: keysOf(BREAKS) }, ({ length, split, body, tail, lineBreak }) => {
	let breaks = LENGTHS[length ?? ``]
	let between = SPLITS[split ?? ``]
	let content = BODIES[body ?? ``]
	let back = TAILS[tail ?? ``]
	let spelling = BREAKS[lineBreak ?? ``]

	if (breaks === undefined || between === undefined || content === undefined || back === undefined || spelling === undefined) throw new Error(`Every axis names a value`)

	let head = breaks ? spelling + between + spelling.repeat(breaks - 1) : between

	return `const a = styled.div\`${head}${content}${back.replaceAll(`\n`, spelling)}\`\n`
})

/** `max-empty-lines` under three primaries, and beside it the two other rules that write a root's head raw and the one that reads it as a level. */
const configs: Sweep[`configs`] = [
	...[0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary })),
	{ rule: `no-empty-first-line`, primary: true },
	{ rule: `no-extra-semicolons`, primary: true },
	{ rule: `indentation`, primary: `tab` },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
