/**
 * The last line of an at-rule's params, held by characters the tokenizer reads as words though JavaScript reads them as whitespace, and by nothing else.
 *
 * Written for 1789421331: `indentation` trimmed the params as JavaScript reads whitespace, so a line holding a vertical tab or a no-break space alone was cut off with the break in front of it and never measured. The runs of the tokenizer's own whitespace and a line with a word on it are the controls, and the rule's selector the neighbour it is compared with.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run opening the last line, none or a level and two under `tab`. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
}

/** What the last line holds behind the run; the last five are the controls. */
const LINES: Record<string, string> = {
	verticalTab: `\v`,
	twoVerticalTabs: `\v\v`,
	noBreakSpace: ` `,
	verticalTabWord: `\va`,
	noBreakSpaceWord: ` a`,
	word: `a`,
	formFeed: `\f`,
	nothing: ``,
}

/** The statement whose params end at `§`: a block's head spaced from the brace and tight on it, a statement closed by a semicolon, one closed by nothing, one at the root, and a rule's selector as the neighbour. */
const PLACES: Record<string, string> = {
	block: `a {\n\t@media print,\n§ {}\n}\n`,
	blockTight: `a {\n\t@media print,\n§{}\n}\n`,
	semicolon: `a {\n\t@include print,\n§;\n}\n`,
	last: `a {\n\t@include print,\n§\n}\n`,
	root: `@import print,\n§\n`,
	selector: `a {\n\tb,\n§ {}\n}\n`,
}

const name: Sweep[`name`] = `params-last-line`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, run: RUNS, line: LINES }, ({ place = ``, run = ``, line = `` }) => place.replace(`§`, `${run}${line}`))

/** The rule under both spellings of its primary, and under the two options that move or silence the params' lines. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`param`] } },
]

export { configs, corpus, name }
