/**
 * A character outside the Basic Multilingual Plane standing in a cell of a grid — alone in the narrowest cell of its column, in the widest, inside a name, in a column that is not the last, in the last, in every cell of its row, in a row of its own, in a row short of a cell, in the widest row, in the second row of the grid, and in a grid of three rows one of which holds no cell at all.
 *
 * Written for #520. `named-grid-areas-alignment` built the width of every column with `String.prototype.length` and padded the cells out to it with `padEnd`, and both count the UTF-16 code units JavaScript stores a text in, where such a character is a surrogate pair standing on one column: a column came out as wide as the code units of its widest cell rather than as the characters of it, and the value came back from the fix out of line, which is what the rule is about. The corpus puts such a character in every place a cell has for it, so that a row says what the padding made of it there; an ordinary letter is the control, whose rows must not move, and the characters beside it come from three planes between them, since nothing of the reading knows one plane from another.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The character a cell is named with: the control first, stored in one code unit, then four stored in a surrogate pair, out of three planes between them. */
const CHARACTERS: Record<string, string> = {
	basicLatinLetter: `z`,
	mathematicalBoldA: `𝐚`,
	emoji: `😀`,
	planeTwoIdeograph: `𠀀`,
	privateUse: `󰀀`,
}

/** Where the character stands, beside a row whose cells do not line up with it. */
const PLACES: Record<string, (character: string) => string[]> = {
	narrowestCell: (character) => [`"${character} bb"`, `"ccc  d"`],
	widestCell: (character) => [`"${character}${character} b"`, `"cc  ddd"`],
	insideName: (character) => [`"a${character}b c"`, `"dd   d"`],
	middleColumn: (character) => [`"a ${character}${character} yy"`, `"bbb xx  y"`],
	lastColumn: (character) => [`"a ${character}${character}"`, `"bbb  x"`],
	everyCellOfTheRow: (character) => [`"${character} ${character}${character}"`, `"aa  b"`],
	wholeRow: (character) => [`"${character}"`, `"cc  c"`],
	shortRow: (character) => [`"${character}${character}bb"`, `"aaaa  b"`],
	widestRow: (character) => [`"${character}${character} ccc"`, `"b  d"`],
	secondRow: (character) => [`"aaa b"`, `"${character} cc"`],
	noCellRow: (character) => [`"${character}${character} b"`, `""`, `"cc  ddd"`],
}

/** The declaration on one line and over several, since the padding of a cell is written only over several. */
const LAYOUTS: Record<string, (rows: string[]) => string> = {
	singleLine: (rows) => `a { grid-template-areas: ${rows.join(` `)}; }\n`,
	multiLine: (rows) => `a {\n\tgrid-template-areas:\n\t\t${rows.join(`\n\t\t`)};\n}\n`,
}

const name: Sweep[`name`] = `grid-cell-plane`

const corpus: Sweep[`corpus`] = multiply({ layout: keysOf(LAYOUTS), place: keysOf(PLACES), character: CHARACTERS }, ({ layout, place, character }) => {
	let lay = LAYOUTS[layout ?? ``]
	let put = PLACES[place ?? ``]

	if (!lay || !put || character === undefined) throw new Error(`Every axis names a value`)

	return lay(put(character))
})

/** The rule under its primary and each of its secondary options, the two of them together, and `string-quotes` as the control that reads the same strings and writes nothing of their text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 3, alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
