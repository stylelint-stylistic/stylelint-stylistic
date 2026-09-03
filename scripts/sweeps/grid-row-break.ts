/**
 * A line break standing in the value of `grid-template-areas`, in every place the value has for one — inside a row, outside every row, and both at once.
 *
 * Written for #402. `named-grid-areas-alignment` asked whether the declaration spans lines of the whole value, and the answer decides whether the cells of a row are padded out to the width of the column they stand in. Every fix the rule makes to a row collapses the whitespace inside it, breaks included, so a break standing inside a row is a character the fix is about to write over: a value whose only break stood there had its cells padded by the very run that was taking that break out of it, and the next run, reading a declaration that no longer spans lines, took the padding away again. The corpus asks the question wherever a break can stand, so that each place says what the run made of a break there; the places outside a row are the control, since the fix hands back everything that is no row character for character and a break standing there is one it leaves.
 *
 * The spellings are the second axis. A bare carriage return and a form feed are whitespace to PostCSS's tokenizer and no line to its line counter, so neither ever made a value one that spans lines: they are the control for the reading of a break itself, and must move nowhere at all.
 *
 * The layout is the third, and it asks about the one break the rule has never counted: the one standing in front of the value rather than in it. A grid is written with its rows under the property far more often than beside it, and the break that puts them there is `raws.between`'s, which is no part of the value the rule reads — so the indented layout must move wherever the inline one does, and by the same texts. The break the rows of such a grid are separated by is a break of the value, and it is the `betweenRows` place.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The break, by how it is spelled: the two spellings PostCSS reads a line break in, then the whitespace it reads no line in. */
const SPELLINGS: Record<string, string> = {
	lineFeed: `\n`,
	windowsPair: `\r\n`,
	carriageReturn: `\r`,
	formFeed: `\f`,
}

/** Where the break stands in the value: inside a row, where the fix writes over it; outside every row — in front of the first, between them, behind the last — where the fix hands it back, whatever node it lands in; and both at once. A row of the value that is not the one the break stands in is spelled so that its cells are out of line, so that the rule has something to say whatever it makes of the break. */
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
	// The escape takes the character behind it, so this place holds a word under a line feed and a word, a space and another word under a Windows pair, whose line feed the escape does not reach.
	escapedInWord: (character) => `x\\${character}y "a  b" "cc  c"`,
	insideDiv: (character) => `"a  b",${character}"cc  c"`,
	insideRowAndBetweenRows: (character) => `"a${character}b"${character}"cc  c"`,
	insideRowAndComment: (character) => `"a${character}b" /*${character}*/ "cc  c"`,
}

/** The value beside the property and under it. The break of the second is `raws.between`'s and no part of the value, so the two layouts must answer alike. */
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

/** The rule under its primary and each of its secondary options, and `string-quotes` as the control that reads the same strings and writes nothing of their text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
