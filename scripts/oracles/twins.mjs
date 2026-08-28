#!/usr/bin/env node

/**
 * Asks of every rule, under every primary option it accepts, over every fixture: does the rule say the same thing about a file whose breaks are spelled with a carriage return, with a form feed or with a Windows pair as it says about the line-feed original?
 *
 * A line feed, a carriage return and a form feed all end a line to every syntax this plugin reads through, so a rule that reads one of them and not the others answers differently about two files that hold the same stylesheet. That is one bug wearing many faces — #173, #196, #204, #209, #244, #245, #246 and #247 are all of them — and none of the other oracles can see it: the outputs converge, they parse, and every comment survives.
 *
 * Four kinds of row come out:
 *
 * - `warns-differently` — the twin draws warnings the original does not, or misses ones it draws. The reading that decides what the rule reports is too narrow, or too wide.
 * - `writes-differently` — the fix writes something else into the twin, once every break of both outputs is normalised back to a line feed. What is compared is therefore what the fix did, never which character it wrote.
 * - `position-differs` — the Windows twin draws the same warnings somewhere else, on another line or in another column. Only that twin is asked, for the reason below.
 * - `parses-differently` — the syntax reads the original and cannot read the twin. Not the rule's doing at all: `postcss-less` ends an inline comment on a line feed and on nothing else, so a Less file whose comment is closed by a carriage return or a form feed is unclosed to it. The same bug one layer down, and nothing else in the repository reports it. The parse happens before any rule runs, so such a row is reported once for the syntax, the fixture and the spelling rather than once for every rule that met it — 812 rows of the first run were 4 findings seen 203 times each.
 *
 * A twin is reported once, on the first of those it fails, so the count is a lower bound on the disagreements rather than a tally of them.
 *
 * ## What a position can and cannot say here
 *
 * PostCSS counts `\r\n` as one line and counts a bare carriage return or a form feed as no line at all: the declaration of `a {\r\ncolor: pink;\r\n}` is at `2:1`, and the declaration of `a {\rcolor: pink;\r}` and of `a {\fcolor: pink;\f}` at `1:5`. So in a file broken with either of those every warning already stands at a position the file does not have, which is a defect upstream of this plugin and nothing a rule of it can be held to. The carriage-return and form-feed twins are therefore compared on the warnings they draw and not on where those warnings fall; the Windows twin, where PostCSS agrees with the original, is compared on both.
 *
 * ## What a twin is built from
 *
 * Every break of the fixture is written back as a line feed first, and the three twins are respelled from that. Respelling without normalising would turn an existing `\r\n` into two breaks and ask the rule about a file that is not the original's twin at all; skipping such a fixture instead would drop the only shapes in the shared corpus that carry whitespace in front of a break, which is exactly what #247 turns on.
 */

import { stdout } from "node:process"

import { lint } from "../harness/lint.mjs"

import { buildRuns, isUsable } from "./runs.mjs"

/** Every break of a text, a Windows pair counting as one so that normalising never leaves an empty line behind it. */
const EVERY_BREAK = /\r\n|[\n\r\f]/gu

/** The three spellings a twin is built in, each under the name its rows are reported by. */
const TWINS = [[`cr`, `\r`], [`ff`, `\f`], [`crlf`, `\r\n`]]

/** Every syntax, fixture and spelling already reported as one the syntax cannot read, since the parse happens before any rule does and reporting it per rule would say one thing two hundred and three times. */
let reportedUnparsable = new Set()

/** Every question already asked, as the rule, the option, the syntax and the normalised fixture together. Two fixtures of the shared corpus differ only in the break they are spelled with — `cr` and `ff` are one text — so normalising makes them the same question, and asking it twice would count one disagreement as two. A row is reported under whichever of the two the run reached first, so the name of the other stands in no row at all. */
let asked = new Set()

/** The one rule whose subject is the spelling itself: `linebreaks` asks which of the two characters a file ends its lines with, so a twin is a different file to it on purpose and every row it would give is the oracle being wrong rather than the rule. */
const SPELLING_IS_THE_SUBJECT = new Set([`linebreaks`])

/**
 * Spells every break of a text with one character in place of the line feed.
 * @param {string} code - The line-feed original.
 * @param {string} spelling - The break to write in its place.
 * @returns {string} The twin.
 */
function respell (code, spelling) {
	return code.replaceAll(`\n`, spelling)
}

/**
 * Writes every break of a text back as a line feed, so that two outputs can be compared on what the fix did rather than on which character it wrote.
 * @param {string} code - The text to normalise.
 * @returns {string} The same text with one spelling of a break throughout.
 */
function normalise (code) {
	return code.replaceAll(EVERY_BREAK, `\n`)
}

/**
 * Lints a text once for its warnings and once for its fix.
 *
 * A run that says nothing is told apart from one the syntax could not read at all, since the second is a finding here rather than a fixture to pass over: where the original parses and the twin does not, the syntax itself reads one break and not another, and that is the same bug this oracle is about, one layer down in a dependency.
 * @param {string} code - The text to lint.
 * @param {object} config - The configuration to lint it under.
 * @returns {Promise<object>} What the rule said and wrote, or why the run cannot be read.
 */
async function ask (code, config) {
	let checked
	let fixed

	try {
		checked = await lint({ code, config })
		fixed = await lint({ code, config, fix: true })
	}
	catch (error) {
		return { read: false, unparsable: true, detail: `threw: ${error.message}` }
	}

	let [first] = checked.results
	let parseError = first.warnings.find((warning) => warning.rule === `CssSyntaxError`)

	if (parseError) return { read: false, unparsable: true, detail: parseError.text }
	if (!isUsable(first)) return { read: false, unparsable: false }

	return {
		read: true,
		warnings: first.warnings.map((warning) => warning.text),
		positions: first.warnings.map((warning) => `${warning.line}:${warning.column}`),
		output: normalise(fixed.code ?? code),
	}
}

/**
 * Names a run, without carrying its configuration into the report.
 * @param {import('./runs.mjs').Run} run - The run to name.
 * @returns {object} The four fields that identify it.
 */
function label (run) {
	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name }
}

/**
 * Asks one fixture and its three twins, and reports where they disagree.
 * @param {import('./runs.mjs').Run} run - The rule, the option, the syntax and the fixture.
 * @returns {Promise<object[]>} Every finding of this run, and the empty array where there is none.
 */
async function probe (run) {
	if (SPELLING_IS_THE_SUBJECT.has(run.rule)) return []

	// The fixture is normalised rather than passed over where it spells a break with something else already: respelling a line feed in a text that holds `\r\n` would make two breaks of one, while normalising first makes every fixture a line-feed original with three twins, and the `cr`, `ff` and `crlf` shapes of the shared corpus — the only ones carrying whitespace in front of a break, which is what #247 turns on — join the run instead of being skipped
	let source = normalise(run.code)

	if (!source.includes(`\n`)) return []

	let question = `${run.rule}|${run.primary}|${run.syntaxName}|${source}`

	if (asked.has(question)) return []

	asked.add(question)

	let original = await ask(source, run.config)

	if (!original.read) return []

	let findings = []

	for (let [spelling, character] of TWINS) {
		let code = respell(source, character)
		// Each twin is a lint of its own, and the three are asked in turn rather than at once so that a run of the oracle stays as light on the machine as the three it joins
		// eslint-disable-next-line no-await-in-loop
		let twin = await ask(code, run.config)

		let common = { ...label(run), spelling, code: source }

		if (!twin.read) {
			if (twin.unparsable) {
				let key = `${run.syntaxName}|${run.name}|${spelling}`

				if (!reportedUnparsable.has(key)) {
					reportedUnparsable.add(key)
					findings.push({ kind: `parses-differently`, syntaxName: run.syntaxName, name: run.name, spelling, code: source, detail: twin.detail })
				}
			}

			continue
		}

		if (twin.warnings.join(`\n`) !== original.warnings.join(`\n`)) {
			findings.push({ kind: `warns-differently`, ...common, original: original.warnings, twin: twin.warnings })
			continue
		}

		if (twin.output !== original.output) {
			findings.push({ kind: `writes-differently`, ...common, original: original.output, twin: twin.output })
			continue
		}

		if (spelling === `crlf` && twin.positions.join(` `) !== original.positions.join(` `)) findings.push({ kind: `position-differs`, ...common, original: original.positions, twin: twin.positions })
	}

	return findings
}

let findings = []

for (let run of buildRuns()) {
	// eslint-disable-next-line no-await-in-loop
	findings.push(...await probe(run))
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
