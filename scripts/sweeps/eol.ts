/**
 * Every fixture of the oracles, its line breaks respelled four ways at once and a carriage return or a form feed put in each of its whitespace positions one at a time, under every rule and every primary option.
 *
 * Written for the change that made the plugin read a line break the way PostCSS does — a line feed or a Windows pair, and nothing else — so that every rule's answer about a bare carriage return and a form feed could be read before and after it, row by row. The whole-file respellings ask what a rule says about a file broken one way throughout; the single positions ask what it says about one such character standing where whitespace stands, since that is what a bare `\r` or `\f` now is.
 */

import { FIXTURES, INLINE_FIXTURES } from "../oracles/fixtures.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

/** The four spellings a whole file is broken with. */
const SPELLINGS = { lf: `\n`, crlf: `\r\n`, cr: `\r`, ff: `\f` }

/** The two characters put into one whitespace position at a time. */
const SINGLES = { cr: `\r`, ff: `\f` }

/** Every run of whitespace in a text, where a single character is put. */
const EVERY_WHITESPACE_RUN = /\s+/gu

/** Every break of a fixture, a Windows pair counting as one. */
const EVERY_BREAK = /\r\n|[\n\r\f]/gu

const name = `eol`

const corpus = [...FIXTURES, ...INLINE_FIXTURES].flatMap(([fixture, code]) => {
	let source = code.replaceAll(EVERY_BREAK, `\n`)
	let rows = Object.entries(SPELLINGS).map(([spelling, character]) => [`${fixture}|whole|${spelling}`, source.replaceAll(`\n`, character)])
	let runs = [...source.matchAll(EVERY_WHITESPACE_RUN)]

	for (let [index, run] of runs.entries()) {
		for (let [single, character] of Object.entries(SINGLES)) {
			rows.push([`${fixture}|at-${index}|${single}`, `${source.slice(0, run.index)}${character}${source.slice(run.index + run[0].length)}`])
		}
	}

	return rows
})

const configs = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
