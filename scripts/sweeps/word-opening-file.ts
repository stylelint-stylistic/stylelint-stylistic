/**
 * A file's first content line opening on a character `\s` matches and the tokenizer reads as a word, behind the empty lines the file opens with.
 *
 * Written for spec 1788997844 ([#683](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/683)): `no-empty-first-line` read the opening run as `\s*\n`, so a vertical tab or a no-break space made it report a first line the parser had put into the first node's own text, and the fix wrote into a raw with nothing to take off. The axes: which character stands there, whether it holds the line alone or opens the line the file's content stands on, how many empty lines run in front of it, what the file holds, and the break's spelling. The openings the tokenizer reads as whitespace are the controls, and so is the opening that is nothing at all.
 *
 * The rules are the three that write the head of the file, plus `indentation`, which reads the run in front of a node as its level.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The character standing at the head of the file: nothing, the four tokenizer whitespace characters short of a line feed, and four characters `\s` matches and the tokenizer reads as a word. */
const OPENINGS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	tab: `\t`,
	formFeed: `\f`,
	bareReturn: `\r`,
	verticalTab: `\u000B`,
	noBreakSpace: `\u00A0`,
	lineSeparator: `\u2028`,
	ideographicSpace: `\u3000`,
}

/** Whether that character holds its line alone or opens the line the file's content stands on. */
const PLACEMENTS: Record<string, string> = {
	ownLine: `«opening»⏎`,
	inFront: `«opening»`,
}

/** How many empty lines run in front of it. */
const HEADS: Record<string, string> = {
	none: ``,
	one: `⏎`,
	two: `⏎⏎`,
	spacedTwo: ` ⏎\t⏎`,
}

/** What the file holds behind the opening; the semicolon leaves the root no node, and the empty body leaves it whitespace alone. */
const BODIES: Record<string, string> = {
	rule: `a { c: d }⏎`,
	semicolon: `;⏎`,
	comment: `/* c */⏎`,
	atRule: `@media all {⏎\tb { c: d }⏎}⏎`,
	nothing: ``,
}

/** The file's line break. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `word-opening-file`

const corpus: Sweep[`corpus`] = multiply({ head: HEADS, placement: PLACEMENTS, opening: OPENINGS, body: BODIES, lineBreak: LINE_BREAKS }, ({ head = ``, placement = ``, opening = ``, body = ``, lineBreak = `` }) => `${head}${placement.replace(`«opening»`, opening)}${body}`.replaceAll(`⏎`, lineBreak))

/** The three rules that write the head of the file, and the one that reads the run in front of a node. */
const configs: Sweep[`configs`] = [
	{ rule: `no-empty-first-line`, primary: true },
	{ rule: `max-empty-lines`, primary: 1 },
	{ rule: `max-empty-lines`, primary: 2 },
	{ rule: `no-extra-semicolons`, primary: true },
	{ rule: `indentation`, primary: `tab` },
]

export { configs, corpus, name }
