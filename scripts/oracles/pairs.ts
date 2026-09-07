#!/usr/bin/env node

/**
 * Asks of every pair of rules, under every primary option, whether `--fix` leaves a different file when the configuration lists the two the other way round.
 *
 * Stylelint runs rules in configuration order, once, so a rule formatting text another rule writes runs before that text exists or after it ([#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352) to [#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355), census in [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356)).
 *
 * Kinds of row:
 *
 * - `cycle` — one order never comes to rest within the passes given ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)); the row carries the cycle's files with their warnings.
 * - `hard` — one order leaves a file the pair still warns on.
 * - `soft` — both orders rest on a clean file, and the two differ.
 *
 * A pair whose orders both rest on a file carrying warnings is a configuration contradicting itself and is dropped, but only where the fixer rests: a contradicting pair may take turns instead.
 */

import { stdout } from "node:process"

import { lint as lintDirectly } from "../harness/lint.ts"

import { RULE_OPTIONS } from "./options.ts"
import { isUsable, PLUGIN } from "./runs.ts"

/** Short, dirty shapes, read as CSS alone: a pair races over the shape of the text, not its syntax. Only `free-semicolon`, `trailing-run`, `root-no-value` and `root-custom-run` end on something other than a line break, the one way to the fix of `no-missing-end-of-source-newline`, so a class of [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356) went unseen until `free-semicolon`; `trailing-run` guards a fix rather than reporting one. `root-no-value` is a top-level declaration, where the run behind the colon and the tail of the file are one text ([#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537)); `root-custom-run` and `root-custom-tail` are the custom-property half of that, the tail inside `decl.value` ([#546](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/546)), two fixtures because only the unclosed one wakes `no-missing-end-of-source-newline`. `ratio-number` pairs `aspect-ratio-notation` with the `value-slash-space-*` rules over one solidus ([#550](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/550)); `ratio-feature` is the same in a media query, with the `media-feature-slash-space-*` rules ([#551](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/551)). `grid-shorthand` puts the rows `named-grid-areas-alignment` rewrites beside a solidus the `value-slash-space-*` rules rewrite ([#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)); `grid-table` adds line names of two widths and a doubled run in front of the solidus, for `no-multiple-whitespaces`. */
const CORPUS: [string, string][] = [
	[`tight-block`, `a{color:red}\n`],
	[`multi-decl`, `a {\n\tcolor: red; top: 0;\n}\n`],
	[`media`, `@media(min-width:100px){a{b:c}}\n`],
	[`value-call`, `a { b: f(1,2)/3 }\n`],
	[`selector-list`, `a,b{c:d}\n`],
	[`ratio`, `a { aspect-ratio: 2; }\n`],
	[`bang`, `a { b: 1px!important }\n`],
	[`nested-media`, `@media screen{\na{b:c;d:e}\n}\n`],
	[`free-semicolon`, `@media all { a {} }\n;`],
	[`trailing-run`, `a { color: pink; }\n\n   `],
	[`wordless-value`, `a { color:  /*c*/ ; }\n`],
	[`whitespace-value`, `a { color: ; }\n`],
	[`no-value-tail`, `a { color: }\n`],
	[`root-no-value`, `color: `],
	[`root-custom-run`, `--b: `],
	[`root-custom-tail`, `--b: \n`],
	[`ratio-number`, `a { aspect-ratio: 2; b: 1 / 2 }\n`],
	[`ratio-feature`, `@media (aspect-ratio: 2) and (16 / 9 <= aspect-ratio) { a { b: c } }\n`],
	[`grid-shorthand`, `a { grid-template: "a  a" 1fr\n\t"b b" auto/1fr 1fr; }\n`],
	[`grid-table`, `a { grid-template: [a] "x  x" 1fr\n\t[bb] "y y" auto  / 1fr; }\n`],
]

/** Passes given to bring a fixture to rest before the run is called a cycle. */
const PASSES = 8

/** Every rule under every primary option it accepts. */
const CONFIGS = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => ({
	rule: `@stylistic/${rule}`,
	primary,
})))

/**
 * Lints one snippet under the rules in the order given.
 * @param code - The snippet.
 * @param rules - The rules, in configuration order.
 * @param fix - Whether the rules may write.
 * @returns The file left, the warning count, and whether the run is usable.
 */
async function lint (code: string, rules: Record<string, unknown>, fix: boolean): Promise<{
	code: string,
	warnings: number,
	usable: boolean,
}> {
	let result

	try {
		result = await lintDirectly({ code, fix, config: { plugins: [PLUGIN], rules } })
	}
	catch {
		return { code, warnings: 0, usable: false }
	}

	let [first] = result.results

	return { code: result.code ?? code, warnings: first.warnings.length, usable: isUsable(first) }
}

/**
 * Picks the configurations that rewrite one fixture: pairing the whole list would cost the square of every option rather than of the handful the shape wakes.
 * @param source - The fixture.
 * @returns The configurations that rewrote it.
 */
async function activeOn (source: string): Promise<{
	rule: string,
	primary: unknown,
}[]> {
	let active: {
		rule: string,
		primary: unknown,
	}[] = []

	for (let config of CONFIGS) {
		// eslint-disable-next-line no-await-in-loop
		let out = await lint(source, { [config.rule]: config.primary }, true)

		if (out.usable && out.code !== source) active.push(config)
	}

	return active
}

/**
 * Runs the fixer over a fixture pass after pass until it writes a file it has written before.
 * @param source - The fixture.
 * @param rules - The rules, in configuration order.
 * @returns The file the first pass left and the cycle the run ended on (one file at rest, several taking turns, none where the passes ran out), or null where the run is unusable.
 */
async function settle (source: string, rules: Record<string, unknown>): Promise<{
	first: string,
	cycle: string[],
} | null> {
	let seen = [source]
	let code = source

	for (let pass = 0; pass < PASSES; pass += 1) {
		// eslint-disable-next-line no-await-in-loop
		let out = await lint(code, rules, true)

		if (!out.usable) return null

		code = out.code

		let at = seen.indexOf(code)

		if (at !== -1) return { first: seen[1] ?? code, cycle: seen.slice(at) }

		seen.push(code)
	}

	return { first: seen[1] ?? code, cycle: [] }
}

/**
 * Counts the warnings each file of a cycle draws.
 * @param files - The files of the cycle.
 * @param rules - The rules to run.
 * @returns One count per file.
 */
async function warningsOver (files: string[], rules: Record<string, unknown>): Promise<number[]> {
	let counts: number[] = []

	for (let file of files) {
		// eslint-disable-next-line no-await-in-loop
		counts.push((await lint(file, rules, false)).warnings)
	}

	return counts
}

/**
 * Runs one pair over one fixture in both orders and compares what each left.
 * @param name - The fixture's name.
 * @param source - The fixture.
 * @param a - One configuration.
 * @param b - The other.
 * @returns The row, or null where the order decides nothing.
 */
async function probe (name: string, source: string, a: {
	rule: string,
	primary: unknown,
}, b: {
	rule: string,
	primary: unknown,
}): Promise<object | null> {
	let aRules = { [a.rule]: a.primary, [b.rule]: b.primary }
	let bRules = { [b.rule]: b.primary, [a.rule]: a.primary }
	let aRun = await settle(source, aRules)
	let bRun = await settle(source, bRules)

	if (!aRun || !bRun) return null

	// A cycle is reported whatever the warnings say: taking turns is a defect of the plugin even under a contradicting configuration
	if (aRun.cycle.length !== 1 || bRun.cycle.length !== 1) {
		return {
			kind: `cycle`,
			name,
			a,
			b,
			aFirst: { cycle: aRun.cycle, warnings: await warningsOver(aRun.cycle, aRules) },
			bFirst: { cycle: bRun.cycle, warnings: await warningsOver(bRun.cycle, bRules) },
		}
	}

	// The other kinds are read off the first pass, as the census was
	let aFirst = aRun.first
	let bFirst = bRun.first

	if (aFirst === bFirst) return null

	let afterA = await lint(aFirst, aRules, false)
	let afterB = await lint(bFirst, aRules, false)
	let remaining = { aFirst: afterA.warnings, bFirst: afterB.warnings }

	if (remaining.aFirst > 0 && remaining.bFirst > 0) return null

	return {
		kind: remaining.aFirst === 0 && remaining.bFirst === 0 ? `soft` : `hard`,
		name,
		a,
		b,
		remaining,
		aFirst,
		bFirst,
	}
}

let findings: object[] = []

for (let [name, source] of CORPUS) {
	// eslint-disable-next-line no-await-in-loop
	let active = await activeOn(source)

	for (let [i, a] of active.entries()) {
		for (let b of active.slice(i + 1)) {
			if (a.rule === b.rule) continue

			// eslint-disable-next-line no-await-in-loop
			let finding = await probe(name, source, a, b)

			if (finding) findings.push(finding)
		}
	}
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
