/**
 * A comma opening a declaration's value, with every spelling of the run between the colon and it, under every rule that reads that run alone.
 *
 * The `declaration-colon-*-after` rules and the `value-list-comma-*-before` rules read and write one run there, and they ask `writesSharedRun` who writes it. Alone, a rule writes as it did, so this is the control: a row moving here is a single rule's reading changed. The pairs are measured by a probe, since the `pairs` oracle drops a pair both orders of which rest on a warning. The control place is a comma between two words, whose run the colon rules never read.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Every spelling of the run between the colon and the comma. */
const RUNS: Record<string, string> = {
	empty: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	lineFeed: `\n`,
	windowsPair: `\r\n`,
	breakThenTab: `\n\t`,
	spaceThenBreak: ` \n`,
	blockComment: ` /*c*/ `,
	commentThenBreak: `/*c*/\n`,
	inlineComment: ` //c\n`,
}

/** Where the comma stands: opening a plain property's value, a custom property's, a multi-line list, a value closed by a flag, a value that is the comma alone, and between two words, which is the control. */
const PLACES: Record<string, (run: string) => string> = {
	plain: (run) => `a { b:${run},c; }\n`,
	custom: (run) => `a { --b:${run},c; }\n`,
	multiLine: (run) => `a { b:${run},c,\n\td; }\n`,
	flagged: (run) => `a { b:${run},c !important; }\n`,
	alone: (run) => `a { b:${run},; }\n`,
	unclosed: (run) => `a { b:${run},c }\n`,
	between: (run) => `a { b: c${run},d; }\n`,
}

const name: Sweep[`name`] = `value-opening-comma`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), run: keysOf(RUNS) }, ({ place, run }) => {
	let wrap = PLACES[place ?? ``]
	let text = RUNS[run ?? ``]

	if (!wrap || text === undefined) throw new Error(`Every axis names a value`)

	return wrap(text)
})

/** The four rules that share the run. */
const configs: Sweep[`configs`] = ([
	[`declaration-colon-space-after`, [`always`, `never`, `always-single-line`]],
	[`declaration-colon-newline-after`, [`always`, `always-multi-line`]],
	[`value-list-comma-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`value-list-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
