/**
 * A quotation mark inside a bare address, and the runs around that address.
 *
 * `no-multiple-whitespaces` walked a value's characters opening a string on every quotation mark it met, and a mark inside a bare address, a character of the address to the grammar, opened one that no mark of the value closed: every run behind it went unread. A row says whether the runs behind the address, inside it and in a string of the value behind it are still read.
 *
 * The address holds the mark in every shape its reading turns on — one of either kind, two of one kind, one escaped, one behind a run — beside controls holding none and a quoted address. A name the tokenizer reads no address behind, `URL(`, `\75 rl(`, a space in front of the parenthesis and a longer name, holds a string the mark does open, and so does a lower-case `url(` under `postcss-scss`, whose parentheses Sass reads as code where they hold a mark. A Sass interpolation and a Less escaped string inside the parentheses hold a string their compiler reads while the tokenizer reads none. The run behind the address is spelled single and doubled, so a row says whether the value's own run is collapsed.
 *
 * The places are the ones the address reaches by a different road: a value, a call, a list of addresses, a string of the value standing behind the address, whose run is the one a mark inside the address used to move into code, and a custom property, whose value the parser keeps whole.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The address: a mark in each shape its reading turns on, and the controls. */
const ADDRESSES: Record<string, string> = {
	doubleMark: `url(c"d)`,
	singleMark: `url(c'd)`,
	twoMarks: `url(c"d"e)`,
	escapedMark: `url(c\\"d)`,
	markThenRun: `url(c"d  e)`,
	runThenMark: `url(c  d"e)`,
	upperName: `URL(c"d  e")`,
	escapedName: `\\75 rl(c"d  e")`,
	sassString: `url(c"d  e")`,
	interpolatedString: `url(c#{"d  e"})`,
	lessEscapedString: `url(~"c  d")`,
	markless: `url(c)`,
	quoted: `url("c")`,
	spacedName: `url (c"d)`,
	longerName: `aurl(c"d")`,
}

/** The run behind the address. */
const RUNS: Record<string, string> = {
	single: ` `,
	doubled: `  `,
}

const name: Sweep[`name`] = `quote-in-bare-address`

const corpus: Sweep[`corpus`] = place(
	multiply({ address: ADDRESSES, run: RUNS }, ({ address = ``, run = `` }) => `${address}${run}`),
	{
		value: (text) => `a { b: ${text}e; f: g }\n`,
		call: (text) => `a { b: h(${text}e); f: g }\n`,
		list: (text) => `a { b: ${text}e, url(i)  k; f: g }\n`,
		string: (text) => `a { b: ${text}"e  f"  g; h: i }\n`,
		customProperty: (text) => `a { --b: ${text}e; f: g }\n`,
	},
)

/** The rule the sweep was written for, and `string-quotes`, which reads the strings a mark inside the address may have opened. */
const configs: Sweep[`configs`] = [
	{ rule: `no-multiple-whitespaces`, primary: true },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
