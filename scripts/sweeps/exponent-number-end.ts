/**
 * A word whose number holds an exponent, in every environment of a value.
 *
 * Written for [#646](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/646), where `unit-case` took the split of a word into a number and a unit from `postcss-value-parser` and Less ends the number at the first character that is no digit and no period. The number is spelled with and without a sign, a period and a leading zero, since the cut is a reading of all four; the exponent's letter stands in both cases, bare and with either sign, and twice over, since a second one opens a dimension of its own to Less.
 *
 * The tails cross the two readings the branch turns on: a unit closing the word (`PX`) is named under both, a unit a digit ends (`PX9`, `PX9PX`) is where the unit's own cut moved, and the rest are what a unit ends in front of under either reading. An empty tail leaves a number or a percentage where the tokenizer reads no dimension at all.
 *
 * Five heads spell no exponent — a plain dimension, a lower-case one, a bare number, a hack unit and an at-variable — and are the control: the branch reads those words exactly as the base does.
 *
 * `color-hex-case` is swept over the same corpus, being the other rule that recases what it reads.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const HEADS = {
	exponent: `1E5`,
	lowerExponent: `1e5`,
	signedExponent: `+1E5`,
	negativeExponent: `-1E5`,
	plusInExponent: `1E+5`,
	minusInExponent: `1E-5`,
	periodExponent: `1.5E3`,
	barePeriodExponent: `.5E3`,
	twoExponents: `1E5E5`,
	letterAlone: `1E`,
	unit: `10PX`,
	lowerUnit: `10px`,
	number: `10`,
	hack: `10PX\\9`,
	atVariable: `@VAR`,
}

const TAILS = {
	none: ``,
	unit: `PX`,
	lowerUnit: `px`,
	unitThenDigit: `PX9`,
	unitThenDigitThenUnit: `PX9PX`,
	underscore: `_PX`,
	percent: `%`,
	keyword: `A`,
	hyphenatedDimension: `-2REM`,
	star: `*2REM`,
	hash: `#FFF`,
	escapedHash: `\\#FFF`,
	atVariable: `@VAR`,
	bang: `!important`,
	outsideAscii: `PXÄ`,
}

const name: Sweep[`name`] = `exponent-number-end`

const corpus: Sweep[`corpus`] = place(
	multiply({ head: HEADS, tail: TAILS }, ({ head = ``, tail = `` }) => `${head}${tail}`),
	{
		declaration: (value) => `a { width: ${value}; }`,
		lastDeclaration: (value) => `a { width: ${value} }`,
		calc: (value) => `a { width: calc(${value} + 1px); }`,
		neighbours: (value) => `a { margin: 1PX ${value} 2PX; }`,
		media: (value) => `@media (min-width: ${value}) { a { b: c; } }`,
		customProperty: (value) => `a { --x: ${value}; }`,
		inlineComment: (value) => `a { width: 1PX // ${value}\n2REM; }`,
	},
)

const configs: Sweep[`configs`] = [
	{ rule: `unit-case`, primary: `lower` },
	{ rule: `unit-case`, primary: `upper` },
	{ rule: `color-hex-case`, primary: `lower` },
	{ rule: `color-hex-case`, primary: `upper` },
]

export { configs, corpus, name }
