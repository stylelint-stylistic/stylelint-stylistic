/** Every fixture of the oracles, its line breaks respelled four ways at once and a bare `\r` or `\f` put in each whitespace position one at a time, under every rule and primary option: written for the change that made the plugin read a line break as PostCSS does, a line feed or a Windows pair only. */

import { FIXTURES, INLINE_FIXTURES } from "../oracles/fixtures.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The four spellings a whole file is broken with. */
const SPELLINGS = { lf: `\n`, crlf: `\r\n`, cr: `\r`, ff: `\f` }

/** The two characters put into one position at a time. */
const SINGLES = { cr: `\r`, ff: `\f` }

/** Every whitespace run. */
const EVERY_WHITESPACE_RUN = /\s+/gu

/** Every break of a fixture, a Windows pair counting as one. */
const EVERY_BREAK = /\r\n|[\n\r\f]/gu

const name: Sweep[`name`] = `eol`

const corpus: Sweep[`corpus`] = [...FIXTURES, ...INLINE_FIXTURES].flatMap(([fixture, code]): [string, string][] => {
	let source = code.replaceAll(EVERY_BREAK, `\n`)
	let rows: [string, string][] = Object.entries(SPELLINGS).map(([spelling, character]) => [`${fixture}|whole|${spelling}`, source.replaceAll(`\n`, character)])
	let runs = [...source.matchAll(EVERY_WHITESPACE_RUN)]

	for (let [index, run] of runs.entries()) {
		for (let [single, character] of Object.entries(SINGLES)) {
			rows.push([`${fixture}|at-${index}|${single}`, `${source.slice(0, run.index)}${character}${source.slice(run.index + run[0].length)}`])
		}
	}

	return rows
})

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
