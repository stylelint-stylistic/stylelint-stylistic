/**
 * A string inside a selector, in every spelling `style-search` reads differently from the tokenizer, wherever a rule searches the selector rather than parses it.
 *
 * Written for spec 1789503901, the offspring of [#739](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/739): the search closes no string at a quotation mark with a backslash in front, escaped or not, so everything behind the mark of `[a="b\\"]` passed for the text of a string and the commas and brackets standing there went unread; and it opens one at a mark inside the bare address of `:is(url(x'y))`, which the tokenizer reads as a character of the address. A row says what a rule makes of the whitespace beside the comma, the brackets, the operator and the combinator behind such a string.
 *
 * The control is a string of the same width the search closes where the tokenizer does, so a branch moving its rows has done something else. A quotation mark inside a comment is a control of the other kind: the search opens no string there, and a masking that blanked the comment too would eat the comma behind it. The single mark stands beside the double one, since the search tracks both.
 */

import { place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The attribute values, each with its quotation marks; the control closes where the tokenizer closes. */
const STRINGS: [string, string][] = [
	[`control`, `"bbb"`],
	[`escapedBackslash`, `"b\\\\"`],
	[`escapedQuote`, `"b\\""`],
	[`singleEscapedBackslash`, `'b\\\\'`],
	[`commaInside`, `"x,y"`],
	[`bracketInside`, `"x]y"`],
	[`blockCommentInside`, `"/*x*/"`],
	[`doubleSlashInside`, `"//xx"`],
	[`breakInside`, `"x\\\ny"`],
]

/** What a bare address holds; the tokenizer reads every one of them as a character of the address, and the search opens a string at the mark. */
const ADDRESSES: [string, string][] = [
	[`control`, `xqy`],
	[`singleMark`, `x'y`],
	[`doubleMark`, `x"y`],
	[`twoMarks`, `x'y'`],
]

const name: Sweep[`name`] = `string-in-selector`

const corpus: Sweep[`corpus`] = [
	...place(STRINGS, {
		beforeComma: (value) => `[a=${value}],c {}\n`,
		afterComma: (value) => `c,[a=${value}] {}\n`,
		betweenCommas: (value) => `x,[a=${value}],c {}\n`,
		spacedBrackets: (value) => `[ a=${value} ],c {}\n`,
		spacedOperator: (value) => `[a = ${value}],c {}\n`,
		beforeCombinator: (value) => `[a=${value}]>c {}\n`,
		acrossLines: (value) => `[a=${value}],\n\n\nc {}\n`,
		insideComment: (value) => `a/*${value}*/,c {}\n`,
	}),
	...place(ADDRESSES, {
		insideIs: (value) => `:is(url(${value})),c {}\n`,
		insideHas: (value) => `a:has(url(${value})),c {}\n`,
	}),
	[`noString|plain`, `aaaaaaa,c {}\n`],
	[`noString|spacedBrackets`, `[ a ],c {}\n`],
]

const configs: Sweep[`configs`] = [
	{ rule: `selector-list-comma-space-after`, primary: `always` },
	{ rule: `selector-list-comma-space-after`, primary: `never` },
	{ rule: `selector-list-comma-space-before`, primary: `always` },
	{ rule: `selector-list-comma-space-before`, primary: `never` },
	{ rule: `selector-list-comma-newline-after`, primary: `always` },
	{ rule: `selector-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-newline-before`, primary: `always` },
	{ rule: `selector-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `selector-attribute-brackets-space-inside`, primary: `always` },
	{ rule: `selector-attribute-brackets-space-inside`, primary: `never` },
	{ rule: `selector-attribute-operator-space-before`, primary: `always` },
	{ rule: `selector-attribute-operator-space-after`, primary: `never` },
	{ rule: `selector-combinator-space-before`, primary: `always` },
	{ rule: `selector-combinator-space-after`, primary: `always` },
	{ rule: `selector-descendant-combinator-no-non-space`, primary: true },
	{ rule: `selector-max-empty-lines`, primary: 0 },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
