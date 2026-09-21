/**
 * A stray semicolon inside the run between a block's last node and its closing brace, under every rule reading that run.
 *
 * Written for [#687](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/687): the `always` fix of `block-closing-brace-newline-before` cut the run from its first break, so a semicolon standing between the run's first whitespace and that break went with the whitespace. The axes: where the block stands, since the parser files the run by what is in front of the brace; what closes it; and where the semicolon stands inside the run, which is what the writes part on. The runs holding no semicolon are the controls.
 */

import { keysOf, multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** Every rule reading or writing the block's final raw, plus the one whose subject the stray semicolon is. */
const RULES = [
	`block-closing-brace-empty-line-before`,
	`block-closing-brace-newline-before`,
	`block-closing-brace-space-before`,
	`block-opening-brace-newline-after`,
	`declaration-block-single-line-max-declarations`,
	`declaration-block-trailing-semicolon`,
	`indentation`,
	`max-empty-lines`,
	`no-extra-semicolons`,
]

/** Where the block stands: `§` the last node, `¶` the run in front of the closing brace. The Sass nested property is a rule whose selector ends in a colon to the core. Behind a brace the last node abuts, a comment leaves `block-opening-brace-newline-after` no break to carry, so its `always` options read the run too (1789520440). */
const PLACES: Record<string, string> = {
	rule: `a {⏎\t§¶}⏎`,
	abuttingRule: `a {§¶}⏎`,
	atRule: `@media (x) {⏎\t§¶}⏎`,
	nested: `@media (x) {⏎\ta {⏎\t\t§¶\t}⏎}⏎`,
	nestedProperty: `a {⏎\tfont: {⏎\t\t§¶\t}⏎}⏎`,
}

/** What closes the block; a declaration with no semicolon of its own takes the run's first semicolon as its terminator, so only a run holding two leaves one in the raw. */
const LASTS: Record<string, string> = {
	declaration: `b: c;`,
	bareDeclaration: `b: c`,
	atRule: `@include x;`,
	comment: `/* c */`,
}

/** Where the semicolon stands against the run's first whitespace and its first break, which is what the writes part on. The two runs without a semicolon are the controls. */
const RUNS: Record<string, string> = {
	breakOnly: `⏎`,
	spaceOnly: ` `,
	abutting: `;⏎`,
	behindASpace: ` ;⏎`,
	behindABreak: `⏎ ;`,
	withoutABreak: ` ; `,
	twice: ` ; ;⏎`,
	aroundTheBreak: ` ;⏎;`,
}

const name: Sweep[`name`] = `brace-run-semicolon`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), last: keysOf(LASTS), run: keysOf(RUNS) }, ({ place, last, run }) => {
	let template = PLACES[place ?? ``]
	let closing = LASTS[last ?? ``]
	let filling = RUNS[run ?? ``]

	if (template === undefined || closing === undefined || filling === undefined) throw new Error(`Every axis names a value`)

	return template.replace(`§`, closing).replace(`¶`, filling).replaceAll(`⏎`, `\n`)
})

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
