/**
 * A solidus between two parts of a value, in every spacing the four `*-slash-space-*` rules distinguish, beside every kind of operand a syntax may divide at, and in every place a rule reads one.
 *
 * Written for [#548](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/548). A vertical tab is a word to the tokenizer ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). The places put the pair where a rule reads a value and where it must not; inside `calc()` the parser returns the solidus as a word, inside `min()` as a divider.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The whitespace on either side of the solidus. */
const SPACINGS: Record<string, [string, string]> = {
	tight: [``, ``],
	spaceBefore: [` `, ``],
	spaceAfter: [``, ` `],
	spaceBoth: [` `, ` `],
	wide: [`  `, `  `],
	tabs: [`\t`, `\t`],
	breakBefore: [`\n`, ``],
	breakAfter: [``, `\n`],
	commentBefore: [`/*c*/`, ` `],
	commentAfter: [` `, `/*c*/`],
	commentsSpaced: [` /*c*/ `, ` /*c*/ `],
	inlineBefore: [` // c\n`, ``],
	inlineAfter: [` `, ` // c\n`],
	verticalTabs: [`\v`, `\v`],
}

/** What stands on either side of the solidus. */
const OPERANDS: Record<string, [string, string]> = {
	numbers: [`1`, `2`],
	dimensions: [`12px`, `1.5`],
	keywords: [`auto`, `span 2`],
	plainCall: [`var(--a)`, `2`],
	plainCallRight: [`2`, `var(--a)`],
	call: [`fn(1)`, `2`],
	callRight: [`2`, `fn(1)`],
	sassVariableRight: [`4`, `$a`],
	sassVariable: [`$a`, `4`],
	lessVariableRight: [`4`, `@a`],
	string: [`"a"`, `2`],
}

/** Where the pair stands. */
const PLACES: Record<string, (pair: string) => string> = {
	value: (pair) => `a { b: ${pair}; }\n`,
	customProperty: (pair) => `a { --b: ${pair}; }\n`,
	colour: (pair) => `a { b: rgb(0 0 0 ${pair}); }\n`,
	call: (pair) => `a { b: g(${pair}); }\n`,
	math: (pair) => `a { b: calc(${pair}); }\n`,
	mathMin: (pair) => `a { b: min(${pair}, 3px); }\n`,
	group: (pair) => `a { b: (${pair}); }\n`,
	customGroup: (pair) => `a { --b: (${pair}); }\n`,
	address: (pair) => `a { b: url(${pair}); }\n`,
	string: (pair) => `a { b: "${pair}"; }\n`,
	media: (pair) => `@media (aspect-ratio: ${pair}) { a { b: c; } }\n`,
	mediaRange: (pair) => `@media (${pair} <= aspect-ratio) { a { b: c; } }\n`,
	mediaGroup: (pair) => `@media ((aspect-ratio: ${pair}) and (width > 1px)) { a { b: c; } }\n`,
	bang: (pair) => `a { b: ${pair} !important; }\n`,
}

const name: Sweep[`name`] = `slash-spaces`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), operands: keysOf(OPERANDS), spacing: keysOf(SPACINGS) }, ({ place, operands, spacing }) => {
	let wrap = PLACES[place ?? ``]
	let pair = OPERANDS[operands ?? ``]
	let sides = SPACINGS[spacing ?? ``]

	if (!wrap || !pair || !sides) throw new Error(`Every axis names a value`)

	return wrap(`${pair[0]}${sides[0]}/${sides[1]}${pair[1]}`)
})

/** The six slash rules, under every primary option `scripts/oracles/options.ts` lists for them. */
const configs: Sweep[`configs`] = ([
	[`value-slash-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`value-slash-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`value-slash-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`value-slash-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`media-feature-slash-space-before`, [`always`, `never`]],
	[`media-feature-slash-space-after`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
