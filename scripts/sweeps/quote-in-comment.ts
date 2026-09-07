/**
 * A quotation mark inside a comment, in front of a string holding the same text the code beside the comment spells ([#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504)).
 *
 * The value parser has no `//` comment node and closes `/*\/` on its own star, so a mark in either opens a string to it and every mark behind changes sides. A row says whether the code beside the comment is still read and whether the string's text is left alone. The controls are a block comment the parser closes where CSS does, and no comment; a branch moving either has done something else. Unlike `slash-star-slash`, the comment holds one mark.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** One text per rule, which that rule has something to say about. */
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

/** The mark in the comment, and around the string behind it. */
const MARKS: Record<string, string> = {
	doubleMark: `"`,
	singleMark: `'`,
}

/** How the comment is spelled: the issue's shape, the inline one, a block comment of the same width as control, and none. */
const SPELLINGS: Record<string, (mark: string) => string> = {
	slashStarSlash: (mark) => `/*/ ${mark} */`,
	inline: (mark) => `// ${mark}\n`,
	block: (mark) => `/** ${mark} */`,
	none: () => ``,
}

/** Where the comment and the string stand. The code goes first, so a rule reading the string's text reports two problems for one; `behindAddress` puts the mark in a bare address too, which the comment scan read as a string's until [#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504). */
const PLACES: Record<string, (text: string, comment: string, mark: string) => string> = {
	value: (text, comment, mark) => `a { b: ${text} ${comment} ${mark}${text}${mark}; }\n`,
	call: (text, comment, mark) => `a { b: g(${text} ${comment} ${mark}${text}${mark}); }\n`,
	grid: (text, comment, mark) => `a { grid-template-areas: ${mark}c   c${mark} ${comment} ${mark}${text}${mark} ${mark}b b${mark}; }\n`,
	media: (text, comment, mark) => `@media ${text} ${comment} and (c: ${mark}${text}${mark}) { a { b: c; } }\n`,
	behindAddress: (text, comment, mark) => `a { b: url(a${mark}b) ${text} ${comment} ${mark}${text}${mark}; }\n`,
}

const name: Sweep[`name`] = `quote-in-comment`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), spelling: keysOf(SPELLINGS), mark: MARKS, text: TEXTS }, ({ place, spelling, mark, text }) => {
	let wrap = PLACES[place ?? ``]
	let spell = SPELLINGS[spelling ?? ``]

	if (!wrap || !spell || mark === undefined || text === undefined) throw new Error(`Every axis names a value`)

	return wrap(text, spell(mark), mark)
})

/** The ten rules of [#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378) and the four comma rules of [#275](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275), under every primary option. */
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
