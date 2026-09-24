/**
 * The run between a declaration's property and its value, where it holds a break and so opens a line of the declaration short of the value.
 *
 * `indentation` measured a declaration's lines only where its value held a break, and PostCSS files the break in front of the value into `raws.between`. The runs holding no break outside a comment are the controls, as is a value holding a break of its own, whose lines were measured already.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run from the property through the colon to the value. */
const RUNS: Record<string, string> = {
	colonSpace: `: `,
	colonBreak: `:\n`,
	colonBreakTab: `:\n\t`,
	colonBreakTwoTabs: `:\n\t\t`,
	colonBreakThreeTabs: `:\n\t\t\t`,
	colonBreakTwoSpaces: `:\n  `,
	colonCrlf: `:\r\n`,
	colonTwoBreaks: `:\n\n`,
	colonCommentBreak: `: /* c */\n`,
	colonBreakComment: `:\n/* c */ `,
	breakColon: `\n: `,
	breakTabColon: `\n\t\t: `,
	commentBreakColon: ` /* c\n*/: `,
}

/** The declaration around the run: `§` stands for it. */
const DECLARATIONS: Record<string, string> = {
	plain: `color§pink`,
	customProperty: `--x§pink`,
	parenthesized: `color§(pink)`,
	brokenValue: `margin§1px\n2px`,
	bang: `color§pink !important`,
}

/** Where the declaration stands: last in a block, in its middle, and in a nested block. */
const PLACES: Record<string, string> = {
	last: `a {\n\t§;\n}\n`,
	middle: `a {\n\t§;\n\ttop: 0;\n}\n`,
	nested: `a {\n\tb {\n\t\t§;\n\t}\n}\n`,
}

const name: Sweep[`name`] = `value-opening-line`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, declaration: DECLARATIONS, run: RUNS }, ({ place = ``, declaration = ``, run = `` }) => place.replace(`§`, declaration.replace(`§`, run)))

/** The rule under both spellings of its primary, and with a value asked for the declaration's level or left unmeasured. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`value`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`value`] } },
]

export { configs, corpus, name }
