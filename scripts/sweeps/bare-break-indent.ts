/**
 * A bare carriage return or a form feed standing where a line's indentation stands: in front of the first node of a file, of a later node, of a declaration, of a closing brace and of a property hack, beside the empty line of a file broken with Windows pairs.
 *
 * Written for #452. Both characters are whitespace to PostCSS's tokenizer and no line to its line counter, so `indentation` read them as part of the indentation it reported, while its two writers looked for spaces and tabs alone and wrote nothing over them — and `--fix` then discarded the warning as fixed.
 *
 * The controls are the same positions holding a line feed, a Windows pair or a space: a branch that moves any of those rows, or the pairs of the Windows-broken file, has done something other than it meant to.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The character put in front of the indentation: the two of the issue, and the three controls. */
const CHARACTERS: Record<string, string> = {
	cr: `\r`,
	ff: `\f`,
	lf: `\n`,
	crlf: `\r\n`,
	space: ` `,
}

/** The indentation standing behind that character: one tab — the level a declaration and a hack stand at under `tab`, and one too many at the start of the file, in front of a later rule and in front of a closing brace — two tabs, and none. */
const TAILS: Record<string, string> = {
	level: `\t`,
	deeper: `\t\t`,
	none: ``,
}

/** Where the run stands, the character and the tail placed at `§`. Every text but the first opens with a line broken the ordinary way, so that a row says what one character did to one line. */
const PLACES: Record<string, string> = {
	fileStart: `§a { color: pink; }\n`,
	laterNode: `a { color: pink; }\n§b { color: pink; }\n`,
	declaration: `a {\n§color: pink;\n}\n`,
	closingBrace: `a {\n\tcolor: pink;\n§}\n`,
	hack: `a {\n§*color: pink;\n}\n`,
	emptyLineOfWindowsFile: `a {\r\n§\r\n\tcolor: pink;\r\n}\r\n`,
}

const name: Sweep[`name`] = `bare-break-indent`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, character: CHARACTERS, tail: TAILS }, ({ place = ``, character = ``, tail = `` }) => place.replace(`§`, `${character}${tail}`))

/** The rule under both spellings of its primary. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

export { configs, corpus, name }
