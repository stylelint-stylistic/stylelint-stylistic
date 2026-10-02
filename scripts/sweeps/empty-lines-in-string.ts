/**
 * A string inside the text each rule of the `max-empty-lines` family reads, beside the text's own empty lines. `function-max-empty-lines` reads a call as one string of text and counted the breaks of the strings standing in it as empty lines of the call, so `--fix` wrote inside a quoted string; the places outside a call are there for the two neighbouring rules, which read the same text for a value list and a selector, and for `max-empty-lines`, which blanks the strings of the text it reads already.
 *
 * The main axis is what the string holds, and what is new in it is a run of breaks the family counts as a run: `break-in-string` varies one break at a time inside a string, `empty-lines-in-comment` varies the comment beside it, and `string-in-selector` spells the marks of a string whose breaks a backslash continues. Four of its values are controls over two readings the family has and not mine: it counts a line feed and a Windows pair as one break each and neither a bare carriage return nor a form feed, the first in two spellings, and a run a backslash continues holds no run at all, since a backslash stands between the breaks. The other axes are the marks the string is spelled with, the space standing between the first mark and the parenthesis, which is what tells a call's string from an address's text to the compilers and the tokenizer alike, and the run behind the string, which the text around it holds and the string does not. Four of a run is one empty line more than the option `1` allows.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the string holds: runs of breaks spelled every way the family counts, and the three controls it reads as no run of empty lines. */
const HOLDS: Record<string, string> = {
	none: ``,
	oneLineFeed: `\n`,
	twoLineFeeds: `\n\n`,
	threeLineFeeds: `\n\n\n`,
	fourLineFeeds: `\n\n\n\n`,
	threeCarriageReturns: `\r\r\r`,
	fourCarriageReturns: `\r\r\r\r`,
	threeWindowsPairs: `\r\n\r\n\r\n`,
	fourWindowsPairs: `\r\n\r\n\r\n\r\n`,
	threeFormFeeds: `\f\f\f`,
	continuedLineFeeds: `\\\n\\\n\\\n`,
	space: ` `,
}

/** The marks a string is spelled with; one mark opens and closes either of them. */
const MARKS: Record<string, string> = { "double": `"`, "single": `'` }

/** What stands between the first mark and the parenthesis: a space behind it and the compilers read the parentheses as a call holding a string, and no space and the tokenizer reads the string apart from them. */
const LEADS: Record<string, string> = { loose: ` `, tight: `` }

/** The run behind the string, which the text around it holds and the string does not. */
const AROUNDS: Record<string, string> = { none: ``, space: ` `, threeLineFeeds: `\n\n\n` }

const name: Sweep[`name`] = `empty-lines-in-string`

const corpus: Sweep[`corpus`] = place(
	multiply({ holds: HOLDS, mark: MARKS, lead: LEADS, around: AROUNDS }, ({ holds = ``, mark = `"`, lead = ``, around = `` }) => `${lead}${mark}x${holds}y${mark}${around}z`),
	{
		call: (text) => `a { b: f(${text}); c: d }\n`,
		nestedCall: (text) => `a { b: f(g(${text})); c: d }\n`,
		address: (text) => `a { b: url(${text}); c: d }\n`,
		bareAddress: (text) => `a { b: url(x${text}); c: d }\n`,
		list: (text) => `a { b: 1px, ${text}, 2px; c: d }\n`,
		value: (text) => `a { b: ${text}; c: d }\n`,
		customProperty: (text) => `a { --b: f(${text}); c: d }\n`,
		selector: (text) => `a[href=${text}] {\n\tb: c;\n}\n`,
	},
)

/** The three rules of the family, each under both primary options, and the block's own, which blanks the strings already. */
const configs: Sweep[`configs`] = [
	{ rule: `function-max-empty-lines`, primary: 0 },
	{ rule: `function-max-empty-lines`, primary: 1 },
	{ rule: `selector-max-empty-lines`, primary: 0 },
	{ rule: `selector-max-empty-lines`, primary: 1 },
	{ rule: `value-list-max-empty-lines`, primary: 0 },
	{ rule: `value-list-max-empty-lines`, primary: 1 },
	{ rule: `max-empty-lines`, primary: 1 },
]

export { configs, corpus, name }
