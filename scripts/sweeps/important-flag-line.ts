/**
 * The run a declaration's bang flag stands in, where it holds a break and so opens a line the value does not hold.
 *
 * Written for the spec 1789503160: `indentation` wrote such a line's indentation onto the end of the value, since PostCSS files the run in front of the flag, and the one inside it, into `raws.important`. The runs holding no break are the controls, as is a declaration carrying no flag at all.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run from the value through the bang to the flag's word. */
const FLAGS: Record<string, string> = {
	none: ``,
	space: ` !important`,
	tab: `\t!important`,
	breakBare: `\n!important`,
	breakTab: `\n\t!important`,
	breakTwoTabs: `\n\t\t!important`,
	breakThreeTabs: `\n\t\t\t!important`,
	breakTwoSpaces: `\n  !important`,
	crlf: `\r\n!important`,
	twoBreaks: `\n\n!important`,
	bangBreak: ` !\nimportant`,
	bangBreakTwoTabs: ` !\n\t\timportant`,
	commentBreak: ` /* c */\n!important`,
	breakComment: `\n/* c */ !important`,
	spacedBang: ` ! important`,
	breakSpacedBang: `\n! important`,
	upper: `\n!IMPORTANT`,
	sassDefault: `\n!default`,
}

/** The declaration the run closes: `§` stands for it. */
const DECLARATIONS: Record<string, string> = {
	plain: `color: pink§`,
	brokenValue: `background-position: top left,\n\t\ttop right§`,
	brokenBetween: `color:\n\tpink§`,
	parenthesized: `color: rgb(1,\n\t\t2, 3)§`,
	customProperty: `--x: pink§`,
}

/** Where the declaration stands: last in a block, in its middle, and in a nested block. */
const PLACES: Record<string, string> = {
	last: `a {\n\t§;\n}\n`,
	middle: `a {\n\t§;\n\ttop: 0;\n}\n`,
	nested: `a {\n\tb {\n\t\t§;\n\t}\n}\n`,
}

const name: Sweep[`name`] = `important-flag-line`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, declaration: DECLARATIONS, flag: FLAGS }, ({ place = ``, declaration = ``, flag = `` }) => place.replace(`§`, declaration.replace(`§`, flag)))

/** The rule under both spellings of its primary and with a value asked for the declaration's level or left unmeasured, beside the two rules reading the run the flag stands in. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`value`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`value`] } },
	{ rule: `declaration-bang-space-before`, primary: `always` },
	{ rule: `declaration-bang-space-before`, primary: `never` },
	{ rule: `declaration-bang-space-after`, primary: `always` },
	{ rule: `declaration-bang-space-after`, primary: `never` },
]

export { configs, corpus, name }
