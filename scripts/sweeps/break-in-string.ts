/**
 * A line break inside a string of a value, and the runs around that string.
 *
 * The grammar ends a string on a line break no backslash continues, a bare carriage return and a form feed as much as a line feed, and reads what follows as code, while PostCSS reads the string on to its closing mark. `no-multiple-whitespaces` read the string as PostCSS does and collapsed the run behind `"c<CR>"<CR>  d`, which took away the break that had ended the second mark's string, so that mark opened a string running to the end of the file. A row's warnings and fix show which runs in front of the string, inside it and behind it are read.
 *
 * The break is each character the grammar reads as one, a Windows pair and a doubled break, bare and behind a backslash, which continues the string over it; the controls are a string holding none and one holding a tab.
 *
 * The places are a value, a call, a list of strings and a custom property, whose value the parser keeps whole.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The break inside the string, bare and continued, and the controls. */
const BREAKS: Record<string, string> = {
	lineFeed: `\n`,
	carriageReturn: `\r`,
	formFeed: `\f`,
	windowsPair: `\r\n`,
	twoCarriageReturns: `\r\r`,
	continuedLineFeed: `\\\n`,
	continuedCarriageReturn: `\\\r`,
	continuedFormFeed: `\\\f`,
	continuedWindowsPair: `\\\r\n`,
	none: ``,
	tab: `\t`,
}

/** The run behind the break inside the string and the run behind the string. */
const RUNS: Record<string, string> = {
	single: ` `,
	doubled: `  `,
}

const name: Sweep[`name`] = `break-in-string`

const corpus: Sweep[`corpus`] = place(
	multiply({ brk: BREAKS, inside: RUNS, behind: RUNS }, ({ brk = ``, inside = ``, behind = `` }) => `"c${brk}${inside}d"${behind}${brk}${behind}e`),
	{
		value: (text) => `a { b: x  ${text}; f: g }\n`,
		call: (text) => `a { b: h(x  ${text}); f: g }\n`,
		list: (text) => `a { b: x  ${text}, "i"  j; f: g }\n`,
		customProperty: (text) => `a { --b: x  ${text}; f: g }\n`,
	},
)

/** The rule the sweep was written for, and `string-quotes`, which reads the strings the break may end. */
const configs: Sweep[`configs`] = [
	{ rule: `no-multiple-whitespaces`, primary: true },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
