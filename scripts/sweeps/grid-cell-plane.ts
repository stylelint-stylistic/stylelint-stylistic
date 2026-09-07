/** A character outside the Basic Multilingual Plane in every place a grid cell has for it. For [#520](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/520), where `named-grid-areas-alignment` measured columns in UTF-16 code units and a surrogate pair made its column a unit too wide. An ordinary letter is the control. */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The control in one code unit, then four surrogate pairs from three planes. */
const CHARACTERS: Record<string, string> = {
	basicLatinLetter: `z`,
	mathematicalBoldA: `𝐚`,
	emoji: `😀`,
	planeTwoIdeograph: `𠀀`,
	privateUse: `󰀀`,
}

/** Where the character stands, beside a row that does not line up with it. */
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

/** Padding is written only over several lines. */
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

/** Each option and both together, with `string-quotes` as a control reading the same strings without rewriting their text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 3, alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
