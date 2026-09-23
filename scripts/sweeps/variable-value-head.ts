/**
 * A Less variable under spellings of the run between its name and its value, among them a value opening with a colon of its own, which `postcss-less` keeps both in `raws.afterName` and at the head of the params but not in the `value` it prints.
 *
 * Written for [#650](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/650): a fix mirrored the whole params into `value`, so every run printed that colon once more. The head is a colon behind the name with and without a space, one, two or three colons, a comment behind the colon or in front of the second one, a break in front of it, and the unmarked spellings with a space in front of the first colon; the value holds a number with a unit, a list, a block comment between its words and an important flag. Every rule under every primary option.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `variable-value-head`

/** The run between the name and the value, the marked spellings first and the two the parser leaves unmarked last. */
const HEADS = {
	plain: `@v: `,
	tight: `@v:`,
	colon: `@v: : `,
	colonTight: `@v: :`,
	twoColons: `@v: : : `,
	comment: `@v:/* c */ `,
	commentColon: `@v:/* c */ : `,
	broken: `@v:\n\t: `,
	spaced: `@v : `,
	spacedColon: `@v : : `,
}

/** The values, each with something a rule writes into. */
const VALUES = {
	unit: `.50PX`,
	list: `1.50PX 0.5EM`,
	comment: `1PX /* c */ 2PX`,
	flag: `1PX !important`,
}

const corpus: Sweep[`corpus`] = multiply({ head: HEADS, value: VALUES }, ({ head, value }) => `${head}${value};\nb { c: @v; }\n`)

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
