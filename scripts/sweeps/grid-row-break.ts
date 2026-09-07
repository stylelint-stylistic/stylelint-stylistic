/**
 * A line break in the value of `grid-template-areas`: inside a row, outside every row, and both.
 *
 * Written for [#402](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/402): `named-grid-areas-alignment` padded a row's cells by whether the whole value spans lines, and every row fix collapses the breaks inside a row, so a value whose only break stood in a row flipped between runs. A bare carriage return and a form feed are no line to PostCSS, so they are the control for the reading of a break. The indented layout's break is `raws.between`'s, so it must move wherever the inline one does.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The break by spelling: the two PostCSS reads a line in, then the two it does not. */
const SPELLINGS: Record<string, string> = {
	lineFeed: `\n`,
	windowsPair: `\r\n`,
	carriageReturn: `\r`,
	formFeed: `\f`,
}

/** Where the break stands: inside a row, where the fix writes over it; outside, where it returns it; and both. */
const PLACES: Record<string, (character: string) => string> = {
	betweenCells: (character) => `"a${character}b" "cc  c"`,
	insideName: (character) => `"a${character}b c" "dd   d"`,
	leadingRow: (character) => `"${character}a b" "cc  c"`,
	trailingRow: (character) => `"a b${character}" "cc  c"`,
	wholeRow: (character) => `"${character}" "cc  c"`,
	leadingCall: (character) => `var(--x${character}) "a  b" "cc  c"`,
	spaceBeforeFirstRow: (character) => `var(--x)${character}"a  b" "cc  c"`,
	betweenRows: (character) => `"a  b"${character}"cc  c"`,
	behindLastRow: (character) => `"a  b" "cc  c"${character}`,
	insideComment: (character) => `"a  b" /*${character}*/ "cc  c"`,
	insideCall: (character) => `"a  b" var(--x${character}) "cc  c"`,
	behindInlineComment: (character) => `"a  b" // c${character}"cc  c"`,
	// The escape takes the character behind it, so a Windows pair makes two words
	escapedInWord: (character) => `x\\${character}y "a  b" "cc  c"`,
	insideDiv: (character) => `"a  b",${character}"cc  c"`,
	insideRowAndBetweenRows: (character) => `"a${character}b"${character}"cc  c"`,
	insideRowAndComment: (character) => `"a${character}b" /*${character}*/ "cc  c"`,
}

/** The value beside the property and under it; the second's break is `raws.between`'s. */
const LAYOUTS: Record<string, (value: string) => string> = {
	inline: (value) => `a { grid-template-areas: ${value}; }\n`,
	indented: (value) => `a {\n\tgrid-template-areas:\n\t\t${value};\n}\n`,
}

const name: Sweep[`name`] = `grid-row-break`

const corpus: Sweep[`corpus`] = multiply({ layout: keysOf(LAYOUTS), place: keysOf(PLACES), spelling: SPELLINGS }, ({ layout, place, spelling }) => {
	let lay = LAYOUTS[layout ?? ``]
	let put = PLACES[place ?? ``]

	if (!lay || !put || spelling === undefined) throw new Error(`Every axis names a value`)

	return lay(put(spelling))
})

/** The rule under each option, and `string-quotes` as the control that writes none of the strings' text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
