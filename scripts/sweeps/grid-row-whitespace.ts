/**
 * A JavaScript whitespace character the tokenizer may not read as one, in every place a grid row has for it.
 *
 * Written for [#401](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/401): `named-grid-areas-alignment` cut a row with `trim` and `\s`, which take every Unicode separator, where the tokenizer reads five characters and `lightningcss` reads every non-ASCII code point as part of a name. The space is the control; the tab and the form feed must collapse like it.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The tokenizer's whitespace first, then what only JavaScript calls whitespace. */
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

/** Where the character stands in the first row; the second row's cells are out of line. */
const PLACES: Record<string, (character: string) => [string, string]> = {
	between: (character) => [`"a${character}b"`, `"cc  c"`],
	insideName: (character) => [`"a${character}b c"`, `"dd   d"`],
	leading: (character) => [`"${character}a b"`, `"cc  c"`],
	trailing: (character) => [`"a b${character}"`, `"cc  c"`],
	wholeRow: (character) => [`"${character}"`, `"cc  c"`],
	trailingCell: (character) => [`"a ${character}"`, `"cc  c"`],
}

/** One line and several, since a cell is padded only over several. */
const LAYOUTS: Record<string, (rows: [string, string]) => string> = {
	singleLine: (rows) => `a { grid-template-areas: ${rows.join(` `)}; }\n`,
	multiLine: (rows) => `a {\n\tgrid-template-areas:\n\t\t${rows.join(`\n\t\t`)};\n}\n`,
}

const name: Sweep[`name`] = `grid-row-whitespace`

const corpus: Sweep[`corpus`] = multiply({ layout: keysOf(LAYOUTS), place: keysOf(PLACES), character: CHARACTERS }, ({ layout, place, character }) => {
	let lay = LAYOUTS[layout ?? ``]
	let put = PLACES[place ?? ``]

	if (!lay || !put || character === undefined) throw new Error(`Every axis names a value`)

	return lay(put(character))
})

/** The rule under each option, and `string-quotes` as the control that writes none of the strings' text. */
const configs: Sweep[`configs`] = [
	{ rule: `named-grid-areas-alignment`, primary: true },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { gap: 2 } },
	{ rule: `named-grid-areas-alignment`, primary: true, secondary: { alignQuotes: true } },
	{ rule: `string-quotes`, primary: `single` },
]

export { configs, corpus, name }
