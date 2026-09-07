#!/usr/bin/env node

/**
 * Asks whether every rule says the same about a Windows-break file as about the original.
 *
 * A rule reading one break and not the other is one bug in many faces ([#173](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/173), [#196](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196), [#204](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/204), [#209](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/209), [#244](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244), [#245](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245), [#246](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/246), [#247](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/247)), which no other oracle sees.
 *
 * Rows, reported on the first failing:
 *
 * - `warns-differently` — other warnings.
 * - `writes-differently` — another fix output, breaks normalised.
 * - `position-differs` — elsewhere; PostCSS counts a pair as one line.
 * - `parses-differently` — the syntax reads the original alone, once per fixture.
 *
 * The fixture is normalised to line feeds first: a `\r\n` would double, and skipping it would drop the only shapes with whitespace before a break ([#247](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/247)).
 */

import { stdout } from "node:process"

import { type Config, lint } from "../harness/lint.ts"

import { buildRuns, isUsable, type Run } from "./runs.ts"

/** Every break. */
const EVERY_BREAK = /\r?\n/gu

/** Each twin's break, by row name. */
const TWINS: [string, string][] = [[`crlf`, `\r\n`]]

/** Every unparsable twin reported. */
let reportedUnparsable = new Set()

/** Every question asked; `plain` and `crlf` differ only in their break. */
let asked = new Set()

/** A twin is another file to `linebreaks`. */
const SPELLING_IS_THE_SUBJECT = new Set([`linebreaks`])

/**
 * Respells every line feed.
 * @param code - The original.
 * @param spelling - The break.
 * @returns The twin.
 */
function respell (code: string, spelling: string): string {
	return code.replaceAll(`\n`, spelling)
}

/**
 * Normalises every break to a line feed.
 * @param code - The text.
 * @returns The text.
 */
function normalise (code: string): string {
	return code.replaceAll(EVERY_BREAK, `\n`)
}

/**
 * Lints a text for warnings and for its fix, telling silence from an unparsable text.
 * @param code - The text.
 * @param config - The Stylelint configuration the fixture is linted under.
 * @returns What the rule said and wrote, or why not.
 */
async function ask (code: string, config: Config): Promise<{
	read: false,
	unparsable: boolean,
	detail?: string,
} | {
	read: true,
	warnings: string[],
	positions: string[],
	output: string,
}> {
	let checked
	let fixed

	try {
		checked = await lint({ code, config })
		fixed = await lint({ code, config, fix: true })
	}
	catch (error) {
		return { read: false, unparsable: true, detail: `threw: ${(error as { message: string }).message}` }
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
 * Names a run without its configuration.
 * @param run - One rule under one primary option over one fixture.
 * @returns The identifying fields.
 */
function label (run: Run): object {
	return { rule: run.rule, primary: run.primary, syntaxName: run.syntaxName, name: run.name }
}

/**
 * Asks one fixture and its twins.
 * @param run - One rule under one primary option over one fixture.
 * @returns Every finding.
 */
async function probe (run: Run): Promise<object[]> {
	if (SPELLING_IS_THE_SUBJECT.has(run.rule)) return []

	// Normalised first, or `\r\n` would double (#247)
	let source = normalise(run.code)

	if (!source.includes(`\n`)) return []

	let question = `${run.rule}|${run.primary}|${run.syntaxName}|${source}`

	if (asked.has(question)) return []

	asked.add(question)

	let original = await ask(source, run.config)

	if (!original.read) return []

	let findings: object[] = []

	for (let [spelling, character] of TWINS) {
		let code = respell(source, character)
		// In turn, to stay light
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

		if (twin.positions.join(` `) !== original.positions.join(` `)) findings.push({ kind: `position-differs`, ...common, original: original.positions, twin: twin.positions })
	}

	return findings
}

let findings: object[] = []

for (let run of buildRuns()) {
	// eslint-disable-next-line no-await-in-loop
	findings.push(...await probe(run))
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
