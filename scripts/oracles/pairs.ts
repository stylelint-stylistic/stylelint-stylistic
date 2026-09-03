#!/usr/bin/env node

/**
 * Asks of every pair of rules, each under every primary option it accepts: does `--fix` leave a different file behind when the configuration lists the two the other way round?
 *
 * Stylelint sorts the rules of a run by their place in its own registry, and a plugin's rules stand nowhere in it: they all sort equal, the sort is stable, and the order is therefore the one the configuration spells. The run is made once, with no second pass over what it wrote, so a rule that formats text another rule writes takes its turn either before that text exists or after it, and which file the user is left with is decided by the order two entries happen to stand in. That is [#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352) to [#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355), and [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356) is the census.
 *
 * Three kinds of row come out:
 *
 * - `cycle` — one of the two orders never brings the fixture to rest: run pass after pass over its own output, the fixer comes back to a file it wrote before without ever writing the same file twice in a row, or is still writing new ones when the passes run out. Every run of `--fix` writes a diff and no run is the last. That is [#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416), and the row carries the files of the cycle with the warnings each of them draws.
 * - `hard` — one of the two orders leaves a file the pair still has something to say about. A rule the user enabled did not take effect, and a second run of the fixer would write again.
 * - `soft` — both orders leave a file the pair is content with, and the two files differ. Nothing is left unsaid, and the output is simply not the configuration's to predict.
 *
 * A pair whose orders both come to rest on a file carrying warnings is dropped rather than reported: the two options contradict each other, and no order of them can satisfy both. That is a configuration wrong about itself rather than the plugin wrong about the file — but only where the fixer rests, since a contradicting pair has a second thing it can do, which is to take the run in turns, and one pass cannot tell the two apart.
 */

import { stdout } from "node:process"

import { lint as lintDirectly } from "../harness/lint.ts"

import { RULE_OPTIONS } from "./options.ts"
import { isUsable, PLUGIN } from "./runs.ts"

/** Shapes short enough to read and dirty enough that many rules have something to say about each. They are read as CSS alone: a pair races over the shape of the text rather than over the syntax it is written in, and reading each shape three times over would treble a run that is already the square of what the fixture wakes. The last two end on something other than a line break, which is what makes the fix of `no-missing-end-of-source-newline` reachable at all: every other shape here has closed its last line already, so that rule wrote nothing in any run this oracle made, and a class of [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356) went unseen. `free-semicolon` is what puts a row of that class on the board; `trailing-run` puts none on either checkout — under a maximum of one or two `max-empty-lines` rewrote nothing there before this fix, so the pair was never made at all, and under a maximum of zero, where it did rewrite, the two orders already agreed — and stands guard over a fix rather than reporting one. */
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
]

/** How many runs of the fixer a pair is given to bring a fixture to rest before the run is called one that never ends. */
const PASSES = 8

/** Every rule of the plugin under every primary option it accepts, each as a configuration of one rule. */
const CONFIGS = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => ({
	rule: `@stylistic/${rule}`,
	primary,
})))

/**
 * Lints one snippet under the rules in the order given.
 * @param code - The snippet.
 * @param rules - The rules to run, in the order the configuration is to spell them.
 * @param fix - Whether the rules are let write.
 * @returns What the run left and what it said, and whether it is a run an oracle can read at all.
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
 * Picks the configurations that have something to write about one fixture.
 *
 * A rule that changes nothing here cannot race with another over it, and pairing the whole list with itself regardless would cost the square of every option the plugin has rather than the square of the handful this shape wakes.
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
 * Runs the fixer over a fixture pass after pass, each over the output of the last, until it writes a file it has written before.
 * @param source - The fixture.
 * @param rules - The rules to run, in the order the configuration is to spell them.
 * @returns The file the first pass left, and the cycle the run ended on: one file where the fixer rests, several where it takes turns, and none at all where the passes ran out first — or nothing, where a run is one an oracle cannot read.
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
 * Counts the warnings each file of a cycle draws, so that two rules taking turns over one character, each leaving one warning, can be told from two rules resting on a file that carries both.
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
 * Runs one pair of configurations over one fixture in both orders, and asks what each order left unsaid.
 * @param name - The name of the fixture.
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

	// A cycle is reported whatever the warnings say: a pair taking the run in turns is a defect of the plugin, however the configuration contradicts itself
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

	// The two kinds below are read off the first pass, as they always were, so that the census keeps its rows
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
