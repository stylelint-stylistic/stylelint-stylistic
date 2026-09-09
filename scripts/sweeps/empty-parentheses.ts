/**
 * A pair of parentheses holding nothing but whitespace, in every spelling of that run and in every place a rule about parentheses reaches.
 *
 * Written for [#329](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/329): the value parser hands such a pair's whole run back as `before` and leaves `after` empty, and no oracle carries the shape — `converge` reports nothing over a base where the fixer grows the run by a character every run. The runs that hold a node are the control set, expected to move nowhere; a no-break space is one of them, since the value parser reads it as a word.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const NO_BREAK_SPACE = String.fromCodePoint(0x00a0)

/** Every spelling of a run the value parser calls whitespace, then the runs holding a node, which are the control. A vertical tab is in the first group and reaches the media rule alone: `splitSpaceNodesAtWords` carries it into a node before `function-parentheses-newline-inside` reads either side ([#496](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496)). */
const RUNS: Record<string, string> = {
	empty: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	lineFeed: `\n`,
	windowsPair: `\r\n`,
	carriageReturn: `\r`,
	formFeed: `\f`,
	breakThenSpaces: `\n  `,
	spacesThenBreak: `  \n`,
	verticalTab: `\v`,
	spaceThenVerticalTab: ` \v`,
	noBreakSpace: NO_BREAK_SPACE,
	word: `a`,
	brokenWord: `\n a \n`,
	spacedWord: ` a `,
	blockComment: `/*c*/`,
	spacedBlockComment: ` /*c*/ `,
	inlineComment: `//c\n`,
	spacedInlineComment: ` //c\n `,
	bareSlashes: `//`,
	comma: `,`,
}

/** Where the pair stands: alone, nested, beside a neighbour holding nodes, and inside a text that is multi-line without it. */
const PLACES: Record<string, (run: string) => string> = {
	value: (run) => `a { b: f(${run}); }\n`,
	nestedInside: (run) => `a { b: g(1, f(${run})); }\n`,
	nestingOnly: (run) => `a { b: g(f(${run})); }\n`,
	beforeSibling: (run) => `a { b: g(f(${run}), 1); }\n`,
	beforeArgument: (run) => `a { b: f(${run}) 1px; }\n`,
	inMultiLineValue: (run) => `a { b: g(1,\n2) f(${run}); }\n`,
	feature: (run) => `@media (${run}) { a { b: c; } }\n`,
	featureValue: (run) => `@media (min-width: calc(${run})) { a { b: c; } }\n`,
	afterFeature: (run) => `@media ( a ) and (${run}) { a { b: c; } }\n`,
	beforeFeature: (run) => `@media (${run}) and ( a ) { a { b: c; } }\n`,
}

const name: Sweep[`name`] = `empty-parentheses`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), run: keysOf(RUNS) }, ({ place, run }) => {
	let wrap = PLACES[place ?? ``]
	let text = RUNS[run ?? ``]

	if (!wrap || text === undefined) throw new Error(`Every axis names a value`)

	return wrap(text)
})

/** The two rules the runaway stands on, and the third rule about a call's parentheses, which turns such a pair away before it reads either side. */
const configs: Sweep[`configs`] = ([
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
