/**
 * Something standing on a node's line in front of it, which the parser files into the node's `raws.before`, behind every run of indentation.
 *
 * `indentation` read the whole last line of `raws.before` as the node's indentation, so a stray semicolon there was reported at every level and its fix, writing the run in front of the semicolon, left the warning standing. The hacks and the bare runs are the controls.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run opening the line: none, a level under `tab`, two levels, a level of two spaces, and a lone carriage return and a form feed, which the tokenizer reads as whitespace. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
	carriageReturnTab: `\r\t`,
	formFeed: `\f`,
}

/** What stands behind the run; the last three are the controls. */
const HEADS: Record<string, string> = {
	semicolon: `; `,
	semicolonTight: `;`,
	twoSemicolons: `;; `,
	star: `*`,
	underscore: `_`,
	nothing: ``,
}

/** The line at `§`: a later declaration, the block's first, a nested rule, the root's first and a later rule. */
const PLACES: Record<string, string> = {
	laterDeclaration: `a {\n\tcolor: red;\n§top: 0;\n}\n`,
	firstDeclaration: `a {\n§top: 0;\n}\n`,
	nestedRule: `@media print {\n§b { top: 0; }\n}\n`,
	fileStart: `§b { top: 0; }\n`,
	laterRule: `a {}\n§b { top: 0; }\n`,
}

const name: Sweep[`name`] = `node-line-head`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, run: RUNS, head: HEADS }, ({ place = ``, run = ``, head = `` }) => place.replace(`§`, `${run}${head}`))

/** The rule under both spellings of its primary. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

export { configs, corpus, name }
