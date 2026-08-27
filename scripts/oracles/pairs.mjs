#!/usr/bin/env node

/**
 * Asks of every pair of rules, each under every primary option it accepts: does `--fix` leave a different file behind when the configuration lists the two the other way round?
 *
 * Stylelint sorts the rules of a run by their place in its own registry, and a plugin's rules stand nowhere in it: they all sort equal, the sort is stable, and the order is therefore the one the configuration spells. The run is made once, with no second pass over what it wrote, so a rule that formats text another rule writes takes its turn either before that text exists or after it, and which file the user is left with is decided by the order two entries happen to stand in. That is [#352](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/352) to [#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355), and [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356) is the census.
 *
 * Two kinds of row come out:
 *
 * - `hard` — one of the two orders leaves a file the pair still has something to say about. A rule the user enabled did not take effect, and a second run of the fixer would write again.
 * - `soft` — both orders leave a file the pair is content with, and the two files differ. Nothing is left unsaid, and the output is simply not the configuration's to predict.
 *
 * A pair whose orders both leave warnings behind is dropped rather than reported: the two options contradict each other, and no order of them can satisfy both. That is a configuration wrong about itself rather than the plugin wrong about the file.
 */

import { stdout } from "node:process"

import stylelint from "stylelint"

import { RULE_OPTIONS } from "./options.mjs"
import { isUsable, PLUGIN } from "./runs.mjs"

/** Shapes short enough to read and dirty enough that many rules have something to say about each. They are read as CSS alone: a pair races over the shape of the text rather than over the syntax it is written in, and reading each shape three times over would treble a run that is already the square of what the fixture wakes. The last two end on something other than a line break, which is what makes the fix of `no-missing-end-of-source-newline` reachable at all: every other shape here has closed its last line already, so that rule wrote nothing in any run this oracle made, and a class of [#356](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/356) went unseen. `free-semicolon` is what puts a row of that class on the board; `trailing-run` puts none on either checkout — under a maximum of one or two `max-empty-lines` rewrote nothing there before this fix, so the pair was never made at all, and under a maximum of zero, where it did rewrite, the two orders already agreed — and stands guard over a fix rather than reporting one. */
const CORPUS = [
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
]

/** Every rule of the plugin under every primary option it accepts, each as a configuration of one rule. */
const CONFIGS = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => ({
	rule: `@stylistic/${rule}`,
	primary,
})))

/**
 * Lints one snippet under the rules in the order given.
 * @param {string} code - The snippet.
 * @param {object} rules - The rules to run, in the order the configuration is to spell them.
 * @param {boolean} fix - Whether the rules are let write.
 * @returns {Promise<{ code: string, warnings: number, usable: boolean }>} What the run left and what it said, and whether it is a run an oracle can read at all.
 */
async function lint (code, rules, fix) {
	let result

	try {
		result = await stylelint.lint({ code, fix, config: { plugins: [PLUGIN], rules } })
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
 * @param {string} source - The fixture.
 * @returns {Promise<object[]>} The configurations that rewrote it.
 */
async function activeOn (source) {
	let active = []

	for (let config of CONFIGS) {
		// eslint-disable-next-line no-await-in-loop
		let out = await lint(source, { [config.rule]: config.primary }, true)

		if (out.usable && out.code !== source) active.push(config)
	}

	return active
}

/**
 * Runs one pair of configurations over one fixture in both orders, and asks what each order left unsaid.
 * @param {string} name - The name of the fixture.
 * @param {string} source - The fixture.
 * @param {object} a - One configuration.
 * @param {object} b - The other.
 * @returns {Promise<object | null>} The row, or null where the order decides nothing.
 */
async function probe (name, source, a, b) {
	let aFirst = await lint(source, { [a.rule]: a.primary, [b.rule]: b.primary }, true)
	let bFirst = await lint(source, { [b.rule]: b.primary, [a.rule]: a.primary }, true)

	if (!aFirst.usable || !bFirst.usable) return null
	if (aFirst.code === bFirst.code) return null

	let both = { [a.rule]: a.primary, [b.rule]: b.primary }
	let afterA = await lint(aFirst.code, both, false)
	let afterB = await lint(bFirst.code, both, false)
	let remaining = { aFirst: afterA.warnings, bFirst: afterB.warnings }

	if (remaining.aFirst > 0 && remaining.bFirst > 0) return null

	return {
		kind: remaining.aFirst === 0 && remaining.bFirst === 0 ? `soft` : `hard`,
		name,
		a,
		b,
		remaining,
		aFirst: aFirst.code,
		bFirst: bFirst.code,
	}
}

let findings = []

for (let [name, source] of CORPUS) {
	// eslint-disable-next-line no-await-in-loop
	let active = await activeOn(source)

	for (let i = 0; i < active.length; i += 1) {
		for (let j = i + 1; j < active.length; j += 1) {
			if (active[i].rule === active[j].rule) continue

			// eslint-disable-next-line no-await-in-loop
			let finding = await probe(name, source, active[i], active[j])

			if (finding) findings.push(finding)
		}
	}
}

stdout.write(`${JSON.stringify(findings, null, `\t`)}\n`)
