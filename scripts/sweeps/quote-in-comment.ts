/**
 * A quotation mark written inside a comment, in front of a string of the value holding the same text the code beside the comment spells.
 *
 * Written for #504. `postcss-value-parser` has no node for a comment opened by a double slash and closes a block comment opening `/*\/` on its own star, so a quotation mark written in the text of either opens a string to it that runs to the next quotation mark of the value — and from there on every opening mark of the file is a closing one to the parser and the other way round. A rule passing over the node that opens inside the comment is not out of it: the string the file spells behind the comment comes back as words of the value and a string never closed, and what the rule says about the words it says about the text inside the quotation marks. The corpus puts the same text beside the comment as code and behind it inside quotation marks of the kind the comment holds, so that a row says two things at once — whether the code beside the comment is still read, and whether the text inside the string is left alone.
 *
 * The controls are the same mark in a block comment the parser closes where CSS does, `/* … *\/`, and no comment at all: a branch that moves either has done something other than it meant to. The `slash-star-slash` sweep holds the same texts behind a comment holding an even number of marks, which pairs them back before the string; this one holds one.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The text a rule has something to say about, one per rule of the ten and the four comma rules. */
const TEXTS: Record<string, string> = {
	unit: `2PX`,
	fractionWithoutZero: `.5`,
	fractionWithZero: `0.5`,
	trailingZero: `1.50px`,
	hex: `#FFF`,
	spacedCall: `f( 1 )`,
	tightCall: `f(1)`,
	brokenCall: `f(1,\n2)`,
	emptyLinesInCall: `f(1,\n\n\n2)`,
	spacedFeature: `( b: 2 )`,
	gridRow: `a  a`,
}

/** The quotation mark the comment holds, which is also the one the string behind it is written with. */
const MARKS: Record<string, string> = {
	doubleMark: `"`,
	singleMark: `'`,
}

/** How the comment is spelled around its mark: the shape of the issue, the inline one the preprocessors read, the control of the same width the parser closes where CSS does, and no comment at all. */
const SPELLINGS: Record<string, (mark: string) => string> = {
	slashStarSlash: (mark) => `/*/ ${mark} */`,
	inline: (mark) => `// ${mark}\n`,
	block: (mark) => `/** ${mark} */`,
	none: () => ``,
}

/** Where the comment and the string stand: in a declaration's value beside the same text as code, inside a call's parentheses, in a grid's rows, where the string is a row, between the parameters of a media query, which is the one text `media-feature-parentheses-space-inside` reads, and behind a bare address holding the same mark, which is a character of the address to every tokenizer and which the scan finding the comments used to read as a string's, so that everything behind the address was read a mark late (#504). The code goes first, so that a rule reading the string's text reports two problems where it should report one. */
const PLACES: Record<string, (text: string, comment: string, mark: string) => string> = {
	value: (text, comment, mark) => `a { b: ${text} ${comment} ${mark}${text}${mark}; }\n`,
	call: (text, comment, mark) => `a { b: g(${text} ${comment} ${mark}${text}${mark}); }\n`,
	grid: (text, comment, mark) => `a { grid-template-areas: ${mark}c   c${mark} ${comment} ${mark}${text}${mark} ${mark}b b${mark}; }\n`,
	media: (text, comment, mark) => `@media ${text} ${comment} and (c: ${mark}${text}${mark}) { a { b: c; } }\n`,
	behindAddress: (text, comment, mark) => `a { b: url(a${mark}b) ${text} ${comment} ${mark}${text}${mark}; }\n`,
}

const name: Sweep[`name`] = `quote-in-comment`

/**
 * Names the keys of a record as an axis whose values are the keys themselves, for a template to look the record up by.
 * @param record - The record.
 * @returns The keys, each under itself.
 */
function keysOf (record: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(Object.keys(record).map((key) => [key, key]))
}

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), spelling: keysOf(SPELLINGS), mark: MARKS, text: TEXTS }, ({ place, spelling, mark, text }) => {
	let wrap = PLACES[place ?? ``]
	let spell = SPELLINGS[spelling ?? ``]

	if (!wrap || !spell || mark === undefined || text === undefined) throw new Error(`Every axis names a value`)

	return wrap(text, spell(mark), mark)
})

/** The ten rules of #378 under every primary option `scripts/oracles/options.ts` lists for them, and the four comma rules #275 moved the same way. */
const configs: Sweep[`configs`] = ([
	[`color-hex-case`, [`lower`, `upper`]],
	[`function-max-empty-lines`, [0, 1]],
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`named-grid-areas-alignment`, [true]],
	[`number-leading-zero`, [`always`, `never`]],
	[`number-no-trailing-zeros`, [true]],
	[`string-quotes`, [`single`, `double`]],
	[`unit-case`, [`lower`, `upper`]],
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`function-comma-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
