/**
 * A character JavaScript calls whitespace and the tokenizer may not, standing in a row of a grid — between two cell names, inside one, at either end of the row, or as the whole of it.
 *
 * Written for #401. `named-grid-areas-alignment` cut a row into cells with `trim` and `\s`, which take every separator Unicode has, where the tokenizer reads a space, a tab, a line feed, a carriage return and a form feed and nothing else, and `lightningcss` reads every code point outside ASCII as a character of a cell's name, the grammar reading any run that is no ident code point as a trash token: a cell named with a no-break space was no cell to the rule, and a name holding one was two names. The corpus puts each character in every place a row has for it, so that a row says what the rule made of the character there; the space is the control, and the tab and the form feed are the characters that must collapse like it.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The character, by what it is: the tokenizer's whitespace first, then what only JavaScript calls whitespace. */
const CHARACTERS: Record<string, string> = {
	space: ` `,
	tab: `\t`,
	formFeed: `\f`,
	verticalTab: `\v`,
	noBreakSpace: ` `,
	figureSpace: ` `,
	narrowNoBreakSpace: ` `,
	ideographicSpace: `　`,
	byteOrderMark: `﻿`,
}

/** Where the character stands in the first row, over a second row whose cells do not line up. */
const PLACES: Record<string, (character: string) => [string, string]> = {
	between: (character) => [`"a${character}b"`, `"cc  c"`],
	insideName: (character) => [`"a${character}b c"`, `"dd   d"`],
	leading: (character) => [`"${character}a b"`, `"cc  c"`],
	trailing: (character) => [`"a b${character}"`, `"cc  c"`],
	wholeRow: (character) => [`"${character}"`, `"cc  c"`],
	trailingCell: (character) => [`"a ${character}"`, `"cc  c"`],
}

/** The declaration on one line and over several, since the padding of a cell is written only over several. */
const LAYOUTS: Record<string, (rows: [string, string]) => string> = {
	singleLine: (rows) => `a { grid-template-areas: ${rows.join(` `)}; }\n`,
	multiLine: (rows) => `a {\n\tgrid-template-areas:\n\t\t${rows.join(`\n\t\t`)};\n}\n`,
}

const name: Sweep[`name`] = `grid-row-whitespace`

/**
 * Names the keys of a record as an axis whose values are the keys themselves, for a template to look the record up by.
 * @param record - The record.
 * @returns The keys, each under itself.
 */
function keysOf (record: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(Object.keys(record).map((key) => [key, key]))
}

const corpus: Sweep[`corpus`] = multiply({ layout: keysOf(LAYOUTS), place: keysOf(PLACES), character: CHARACTERS }, ({ layout, place, character }) => {
	let lay = LAYOUTS[layout ?? ``]
	let put = PLACES[place ?? ``]

	if (!lay || !put || character === undefined) throw new Error(`Every axis names a value`)

	return lay(put(character))
})

/** The rule under its primary and each of its secondary options, and `string-quotes` as the control that reads the same strings and writes nothing of their text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
