/**
 * A delimiter a `style-search` scan looks for, spelled behind a backslash, in every text a search copy is built of.
 *
 * Written for 1789649818, where the copy hid strings and comments from the search and not escapes, so `a\,b` was a list of two and a rule wrote whitespace beside the backslash. The delimiter stands behind one to three backslashes, since the run's parity decides whether it is escaped; a hexadecimal spelling of the comma is written closed by a space, by a line break, which the copy keeps, and by nothing, and behind the first and the last a plain comma; an escaped space in front of a comma, a colon, a range operator or a bang is the one write the bug made, and the one 1789657288 reads over the copy, with an escaped tab, a hexadecimal escape closed by a space in front of each delimiter, one closed by a break in front of a comma, and a backslash in front of a break and a comma, where the backslash escapes nothing, beside it; a hexadecimal letter closing a call's name puts a comma inside a call the search opens only behind a letter. The run behind the delimiter spells every whitespace the options distinguish, and a break in front of the backslashes makes the node multi-line, so the lineness options are reached.
 *
 * Every rule building a search copy is swept, `max-empty-lines` under the option that reads the copy, and `function-comma-space-before`, which reads the value by `postcss-value-parser` and knows an escape, is the control. So are the rows spelling `\!important`: the bang checker refuses a bang behind an odd run of backslashes on its own, and the rows behind an even run are written alike on both sides.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The backslashes in front of the delimiter: an escape, an escaped backslash, and an escape behind one. */
const BACKSLASHES: Record<string, string> = {
	one: `\\`,
	two: `\\\\`,
	three: `\\\\\\`,
}

/** The delimiters a scan looks for, and a hexadecimal comma in three spellings. */
const DELIMITERS: Record<string, string> = {
	comma: `,`,
	colon: `:`,
	bang: `!important`,
	greater: `>`,
	openingParenthesis: `(`,
	closingParenthesis: `)`,
	spaceThenComma: ` ,`,
	spaceThenColon: ` :`,
	spaceThenGreater: ` >`,
	spaceThenBang: ` !important`,
	hexComma: `2c `,
	hexCommaThenComma: `2c ,`,
	hexCommaUnclosedThenComma: `2c,`,
	hexCommaThenBreak: `2c\n`,
	hexCommaBreakThenComma: `2c\n,`,
	hexThenColon: `2c :`,
	hexThenGreater: `2c >`,
	hexThenBang: `2c !important`,
	tabThenComma: `\t,`,
	breakThenComma: `\n,`,
	hexLetterThenCall: `6f(1,2)`,
}

/** The run in front of the backslashes: none, or a break making the node multi-line. */
const BEFORE: Record<string, string> = {
	"none": ``,
	"break": `\n`,
}

/** The run behind the delimiter. */
const AFTER: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"break": `\n`,
}

const name: Sweep[`name`] = `escaped-delimiter`

const corpus: Sweep[`corpus`] = place(
	multiply({ before: BEFORE, backslashes: BACKSLASHES, delimiter: DELIMITERS, after: AFTER }, ({ before = ``, backslashes = ``, delimiter = ``, after = `` }) => `${before}${backslashes}${delimiter}${after}`),
	{
		value: (text) => `a { b: 1,a${text}b 2px; c: d }`,
		valueHead: (text) => `a { b: ${text}b,1; c: d }`,
		call: (text) => `a { b: f(1,a${text}b) 2px; c: d }`,
		mediaFeature: (text) => `@media (a${text}b) { c { d: e } }`,
		mediaList: (text) => `@media a,b${text}c { d { e: f } }`,
		selector: (text) => `a,b${text}c { d: e }`,
		selectorHead: (text) => `${text}b,c { d: e }`,
		block: (text) => `a {\n\tb: 1,a${text}b;\n\tc: d;\n}`,
	},
)

/** Every rule building a search copy, under each option, and the control. */
const configs: Sweep[`configs`] = [
	{ rule: `value-list-comma-space-before`, primary: `always` },
	{ rule: `value-list-comma-space-before`, primary: `never` },
	{ rule: `value-list-comma-space-after`, primary: `always` },
	{ rule: `value-list-comma-space-after`, primary: `never` },
	{ rule: `value-list-comma-newline-before`, primary: `always` },
	{ rule: `value-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `value-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `value-list-comma-newline-after`, primary: `always` },
	{ rule: `value-list-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `value-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `media-query-list-comma-space-before`, primary: `always` },
	{ rule: `media-query-list-comma-space-before`, primary: `never` },
	{ rule: `media-query-list-comma-space-after`, primary: `always` },
	{ rule: `media-query-list-comma-space-after`, primary: `never` },
	{ rule: `media-query-list-comma-newline-before`, primary: `always` },
	{ rule: `media-query-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `media-query-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `media-query-list-comma-newline-after`, primary: `always` },
	{ rule: `media-query-list-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `media-query-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-space-before`, primary: `always` },
	{ rule: `selector-list-comma-space-before`, primary: `never` },
	{ rule: `selector-list-comma-space-after`, primary: `always` },
	{ rule: `selector-list-comma-space-after`, primary: `never` },
	{ rule: `selector-list-comma-newline-before`, primary: `always` },
	{ rule: `selector-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `selector-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-newline-after`, primary: `always` },
	{ rule: `selector-list-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `selector-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `media-feature-colon-space-before`, primary: `always` },
	{ rule: `media-feature-colon-space-before`, primary: `never` },
	{ rule: `media-feature-colon-space-after`, primary: `always` },
	{ rule: `media-feature-colon-space-after`, primary: `never` },
	{ rule: `media-feature-range-operator-space-before`, primary: `always` },
	{ rule: `media-feature-range-operator-space-before`, primary: `never` },
	{ rule: `media-feature-range-operator-space-after`, primary: `always` },
	{ rule: `media-feature-range-operator-space-after`, primary: `never` },
	{ rule: `declaration-bang-space-before`, primary: `always` },
	{ rule: `declaration-bang-space-before`, primary: `never` },
	{ rule: `declaration-bang-space-after`, primary: `always` },
	{ rule: `declaration-bang-space-after`, primary: `never` },
	{ rule: `function-whitespace-after`, primary: `always` },
	{ rule: `function-whitespace-after`, primary: `never` },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `max-empty-lines`, primary: 1, secondary: { ignore: [`comments`] } },
	{ rule: `function-comma-space-before`, primary: `always` },
]

export { configs, corpus, name }
