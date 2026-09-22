/**
 * A comma at either edge of a call's arguments — right behind the opening parenthesis, or right in front of the closing one — with every spelling of the run between it and the parenthesis, under every rule about a comma or a parenthesis of a call.
 *
 * Written for 1790021150: the comma rules judged that run where it held anything and, but for `function-comma-newline-before`, passed it over where it held nothing, while the parentheses rules judge it always, so a pair asking the opposite of each other over it left a warning no `--fix` could take away. No oracle corpus holds a comma at the edge. The control is the comma between two arguments, whose runs the comma rules keep.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Every spelling of the run between the edge comma and its parenthesis. */
const RUNS: Record<string, string> = {
	empty: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	lineFeed: `\n`,
	windowsPair: `\r\n`,
	breakThenSpaces: `\n  `,
	blockComment: `/*c*/`,
	spacedBlockComment: ` /*c*/ `,
	commentThenBreak: `/*c*/\n`,
	inlineComment: `//c\n`,
}

/** Where the comma stands: at the closing edge, at the opening edge, at both, in a call with a break elsewhere, in a nested call, in the fallback of a custom property, and between two arguments, which is the control. */
const PLACES: Record<string, (run: string) => string> = {
	closing: (run) => `a { b: f(1,${run}); }\n`,
	opening: (run) => `a { b: f(${run},1); }\n`,
	both: (run) => `a { b: f(${run},${run}); }\n`,
	closingMultiLine: (run) => `a { b: f(\n\t1,${run}); }\n`,
	openingMultiLine: (run) => `a { b: f(${run},1\n); }\n`,
	nested: (run) => `a { b: g(f(1,${run}), 2); }\n`,
	fallback: (run) => `a { b: var(--x,${run}); }\n`,
	between: (run) => `a { b: f(1,${run}2); }\n`,
	betweenMultiLine: (run) => `a { b: f(\n\t1,${run}2); }\n`,
}

const name: Sweep[`name`] = `argument-edge-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), run: keysOf(RUNS) }, ({ place, run }) => {
	let wrap = PLACES[place ?? ``]
	let text = RUNS[run ?? ``]

	if (!wrap || text === undefined) throw new Error(`Every axis names a value`)

	return wrap(text)
})

/** The four comma rules that leave the edge run alone now, and the two parentheses rules it belongs to. */
const configs: Sweep[`configs`] = ([
	[`function-comma-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`function-comma-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
