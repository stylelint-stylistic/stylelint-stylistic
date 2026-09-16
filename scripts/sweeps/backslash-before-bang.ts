/**
 * A backslash ending the text in front of a bang.
 *
 * PostCSS lets a backslash cover no whitespace, so `red \` ends a value there; the grammar reads one in front of a line break as a delimiter and one in front of anything else as an escape. A write changing the character behind it is read with it by one of the two. Hence the backslash runs, odd and even, and the runs behind them; `backslash-before-semicolon` holds no bang.
 *
 * `declaration-bang-space-after` is the control: it writes behind the bang, so a branch about the run in front of it should move no row.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The text in front of the backslashes: a value, and a value with nothing but the backslashes. */
const VALUES: Record<string, string> = {
	word: `red `,
	abutting: `red`,
	empty: ``,
}

/** The backslashes ending the value: none, one, an escaped one, and one behind that. */
const BACKSLASHES: Record<string, string> = {
	none: ``,
	one: `\\`,
	two: `\\\\`,
	three: `\\\\\\`,
}

/** The run between the backslashes and the bang. */
const RUNS: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"formFeed": `\f`,
	"break": `\n`,
	"crlf": `\r\n`,
	"comment": `/* c */`,
}

/** The flag behind the bang. */
const FLAGS: Record<string, string> = {
	important: `!important`,
	spacedImportant: `! important`,
	other: `!ie`,
}

/** Where the declaration stands, and what follows it. */
const PLACES: Record<string, string> = {
	last: `a { color: § }\n`,
	followed: `a { color: §; top: 0 }\n`,
	sassDefault: `$b: §;\n`,
}

const name: Sweep[`name`] = `backslash-before-bang`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, value: VALUES, backslashes: BACKSLASHES, run: RUNS, flag: FLAGS }, ({ place = ``, value = ``, backslashes = ``, run = ``, flag = `` }) => place.replace(`§`, `${value}${backslashes}${run}${flag}`))

/** The two rules the checker serves, under every option. */
const configs: Sweep[`configs`] = ([
	[`declaration-bang-space-before`, [`always`, `never`]],
	[`declaration-bang-space-after`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
