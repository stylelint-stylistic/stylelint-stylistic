/**
 * An opening bracket ending its line, whitespace of the line standing behind it.
 *
 * `indentation` raises the line behind a `(` or a `{` ending its line, and asked whether a line ends in one past spaces and tabs alone: a form feed or a bare carriage return behind the bracket, whitespace of the line to PostCSS, hid it, and the line behind drew a warning a level short where it stood right and was moved there by the fix. A row says at which level the line behind the bracket is asked for.
 *
 * The run behind the bracket is each whitespace character of the line, a few of them together, and a block comment on either side of a carriage return; every row closes the bracket's line with a line feed and with a Windows pair, and nothing behind the bracket is the control.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands between the bracket and the break. */
const RUNS: Record<string, string> = {
	none: ``,
	space: ` `,
	tab: `\t`,
	formFeed: `\f`,
	carriageReturn: `\r`,
	twoCarriageReturns: `\r\r`,
	spaceFormFeed: ` \f`,
	commentCarriageReturn: `/* c */\r`,
	carriageReturnComment: `\r/* c */`,
}

/** The break closing the bracket's line. */
const BREAKS: Record<string, string> = {
	lineFeed: `\n`,
	windowsPair: `\r\n`,
}

/** The bracket and what it opens, `§` standing for the run and `¶` for the break; the line behind stands at the level asked for behind the bracket. */
const PLACES: Record<string, string> = {
	parenthesis: `a {¶\tb: (§¶\t\t1px¶\t);¶}¶`,
	call: `a {¶\tb: f(§¶\t\t1px,¶\t\t2px¶\t);¶}¶`,
	map: `a {¶\tb: f({§¶\t\tc: d¶\t});¶}¶`,
	mediaFeature: `@media (§¶\tmin-width: 1px¶) {¶\ta { b: c }¶}¶`,
}

const name: Sweep[`name`] = `bracket-line-end`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, run: RUNS, brk: BREAKS }, ({ place = ``, run = ``, brk = `` }) => place.replaceAll(`¶`, brk).replace(`§`, run))

/** The rule under both spellings of its primary, and with the parentheses indented twice. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { indentInsideParens: `twice` } },
]

export { configs, corpus, name }
