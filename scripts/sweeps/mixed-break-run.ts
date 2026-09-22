/**
 * A run of breaks spelled with a line feed and a Windows pair in every order, inside the text each rule of the `max-empty-lines` family reads, under both primary options.
 *
 * Written for [#732](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/732). The three rules read a run by one pattern for pairs and one for line feeds, so a run was found only where two breaks of one spelling happened to stand side by side: `\n\r\n` was no run to either, and a longer run was cut to that spelling and read clean. Every run of two to four breaks in every spelling, since a run of three or four is where the fix leaves a shorter run behind; a run of one and a bare carriage return, a form feed or a space between two breaks are the controls, whitespace parting two runs of one to the tokenizer. The corpus of `empty-lines-in-comment` spells a mixed run only as `\r\n\n\n\r\n` or as a run of one spelling abutting a run of the other under its `none` control, both holding breaks of one spelling side by side and so found by the old reading; `eol` respells whole fixtures and mixes nothing.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const FORM_FEED = String.fromCodePoint(0x0c)

/**
 * Spells every run of the length in line feeds and Windows pairs.
 * @param length - How many breaks the run holds.
 * @returns The runs, keyed by their spelling with `n` for a line feed and `rn` for a pair.
 */
function spellings (length: number): Record<string, string> {
	let runs: Record<string, string> = { "": `` }

	for (let position = 0; position < length; position += 1) {
		runs = Object.fromEntries(Object.entries(runs).flatMap(([key, run]) => [[`${key}n`, `${run}\n`], [`${key}rn`, `${run}\r\n`]]))
	}

	return runs
}

const RUNS: Record<string, string> = { ...spellings(1), ...spellings(2), ...spellings(3), ...spellings(4), bareReturnBetween: `\n\r\r\n`, formFeedBetween: `\r\n${FORM_FEED}\n`, spaceBetween: `\n \r\n` }

const PLACES: Record<string, (run: string) => string> = {
	callOpening: (run) => `a { transform: translate(${run}1, 1); }\n`,
	callMiddle: (run) => `a { transform: translate(1,${run}1); }\n`,
	callClosing: (run) => `a { transform: translate(1, 1${run}); }\n`,
	nestedCall: (run) => `a { transform: translate(calc(1${run}+ 1), 1); }\n`,
	valueMiddle: (run) => `a { padding: 10px${run}10px 10px; }\n`,
	valueTwoRuns: (run) => `a { padding: 10px${run}10px${run}10px; }\n`,
	valueBehindComment: (run) => `a { padding: 10px /*c*/${run}10px; }\n`,
	selectorMiddle: (run) => `.foo${run}.bar { }\n`,
	selectorAfterComma: (run) => `.foo,${run}.bar { }\n`,
	selectorBehindComment: (run) => `.foo /*c*/${run}.bar { }\n`,
}

const name: Sweep[`name`] = `mixed-break-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), run: keysOf(RUNS) }, ({ place, run }) => {
	let spell = PLACES[place ?? ``]
	let text = RUNS[run ?? ``]

	if (!spell || text === undefined) throw new Error(`Every axis names a value`)

	return spell(text)
})

/** The three rules of the family, each under both primary options. */
const configs: Sweep[`configs`] = [`function-max-empty-lines`, `selector-max-empty-lines`, `value-list-max-empty-lines`].flatMap((rule) => [0, 1].map((primary) => ({ rule, primary })))

export { configs, corpus, name }
