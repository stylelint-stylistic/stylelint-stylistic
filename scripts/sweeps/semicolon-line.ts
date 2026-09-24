/**
 * The run in front of a statement's semicolon, where it holds a break and so opens a line for the semicolon alone.
 *
 * `indentation` measured that line nowhere, since `checkMultilineBit` passes over a line without content and `checkAtRuleParams` trims the run off the params. The runs short of a break are the controls, as are the vertical tab and the no-break space, which are words to the tokenizer and so stand on a line of the value or the params.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run: the tokenizer's whitespace, then two characters it reads as words. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	tab: `\t`,
	breakOnly: `\n`,
	breakTab: `\n\t`,
	breakTwoTabs: `\n\t\t`,
	breakTwoSpaces: `\n  `,
	crlfTab: `\r\n\t`,
	breakBareReturnTab: `\n\r\t`,
	breakFormFeedTab: `\n\f\t`,
	breakVerticalTab: `\n\v`,
	breakNoBreakSpace: `\n `,
	twoBreaksTab: `\n\t\t\n\t`,
}

/** The statement the semicolon closes: three declarations keeping the run in three raws, and three bodiless at-rules, the mixin call a Less one. */
const STATEMENTS: Record<string, string> = {
	declaration: `color: pink`,
	customProperty: `--x: pink`,
	bang: `color: pink !important`,
	extend: `@extend .b`,
	include: `@include m`,
	mixinCall: `.m()`,
}

/** Where the statement stands: last in a block, in its middle, at the root, and in a nested block. */
const PLACES: Record<string, string> = {
	last: `a {\n\t§\n}\n`,
	middle: `a {\n\t§\n\ttop: 0;\n}\n`,
	root: `§\na {}\n`,
	nested: `a {\n\tb {\n\t\t§\n\t}\n}\n`,
}

const name: Sweep[`name`] = `semicolon-line`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, statement: STATEMENTS, run: RUNS }, ({ place = ``, statement = ``, run = `` }) => place.replace(`§`, `${statement}${run};`))

/** The rule under both spellings of its primary, and with the lines of a value and of params left unmeasured. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`value`, `param`] } },
]

export { configs, corpus, name }
