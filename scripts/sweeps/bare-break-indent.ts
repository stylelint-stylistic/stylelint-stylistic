/**
 * A bare carriage return or a form feed where a line's indentation stands, in front of every kind of node and beside the empty line of a Windows-broken file.
 *
 * Written for [#452](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452): both are whitespace to PostCSS's tokenizer and no line to its counter, so `indentation` reported them, its writers, looking for spaces and tabs, wrote nothing, and `--fix` discarded the warning as fixed. The controls hold a line feed, a Windows pair or a space.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The two of the issue, and three controls. */
const CHARACTERS: Record<string, string> = {
	cr: `\r`,
	ff: `\f`,
	lf: `\n`,
	crlf: `\r\n`,
	space: ` `,
}

/** One tab, the level of a declaration and a hack under `tab` and one too many elsewhere; two tabs; none. */
const TAILS: Record<string, string> = {
	level: `\t`,
	deeper: `\t\t`,
	none: ``,
}

/** The run stands at `§`; every text but the first opens with an ordinary break, so a row is about one line. */
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
