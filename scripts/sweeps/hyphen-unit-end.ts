/**
 * A word whose dimension is welded to something by a hyphen, in every environment of a value.
 *
 * Written for [#633](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/633), where `unit-case` read the hyphen as a code point of the unit's identifier and Less reads it as the sign of the operand behind it. The hyphen is spelled bare and in runs of two, three and four, since Less reads the first as its operator and the second as the operand's sign while a third leaves a keyword, behind none to three backslashes, since the run's parity decides whether it is an operator or a character of an escape, and with whitespace on either side, where the word parts before the rule ever sees it. The head carries the hyphen at the front and inside, and each thing the hyphen may weld on stands behind the dimension.
 *
 * The tails cross the two readings the branch turns on: a dimension (`2REM`) is a unit to name on its own, a keyword (`A`, `A-B`, `A-2REM`) holds hyphens of its own to Less and is none, and the rest are what a unit ends in front of under either reading.
 *
 * Five separators spell no hyphen at all — none, a star, a plus, a period and an escaped hyphen — and are the control: the branch reads those words exactly as the base does.
 *
 * `color-hex-case` is swept over the same corpus, being the other rule that recases what it reads.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const HEADS = { unit: `10PX`, lowerUnit: `10px`, number: `10`, exponent: `1E5PX`, hack: `10PX\\9`, word: `A`, atVariable: `@VAR` }

const SEPARATORS = {
	none: ``,
	hyphen: `-`,
	twoHyphens: `--`,
	threeHyphens: `---`,
	fourHyphens: `----`,
	escapedHyphen: `\\-`,
	escapedBackslashThenHyphen: `\\\\-`,
	threeBackslashesThenHyphen: `\\\\\\-`,
	hackThenHyphen: `\\9-`,
	hyphenThenHack: `-\\9`,
	spaceThenHyphen: ` -`,
	hyphenThenSpace: `- `,
	spacesAroundHyphen: ` - `,
	star: `*`,
	plus: `+`,
	period: `.`,
}

const TAILS = { none: ``, dimension: `2REM`, twoDimensions: `2REM-3EM`, word: `A`, hyphenatedWord: `A-B`, wordThenDimension: `A-2REM`, wordThenDigit: `A2`, atVariable: `@VAR`, escapedAtVariable: `\\@VAR`, hash: `#FFF`, percent: `%`, bang: `!important`, closingBrace: `}` }

const FRONTS = { none: ``, hyphen: `-`, escapedHyphen: `\\-` }

/** A head whose hyphen stands inside the word, at its front or at its end, where the unit it leaves may be empty, whole or cut in the middle. */
const INSIDES = {
	hyphenInside: `10P-X`,
	closingHyphen: `10PX-`,
	leadingHyphen: `-10PX`,
	hyphenOnNumber: `10-PX`,
	hyphenOnNumberThenDimension: `10-PX-2REM`,
	twoHyphenatedDimensions: `10PX-2REM-3EM`,
	escapedHyphenThenHyphen: `10PX\\-2REM-3EM`,
	hyphenThenEscapedHyphen: `10PX-2REM\\-3EM`,
	hyphenBehindHack: `10PX\\9-A`,
	hackBehindHyphen: `10PX-\\9A`,
	hyphenatedKeywordThenDimension: `10PX-A-2REM`,
	starThenHyphen: `10PX*2REM-3EM`,
	hyphenThenStar: `10PX-2REM*3EM`,
}

const name: Sweep[`name`] = `hyphen-unit-end`

const corpus: Sweep[`corpus`] = place(
	[
		...multiply({ head: HEADS, separator: SEPARATORS, tail: TAILS }, ({ head = ``, separator = ``, tail = `` }) => `${head}${separator}${tail}`),
		...multiply({ front: FRONTS, head: HEADS }, ({ front = ``, head = `` }) => `${front}${head}`),
		...multiply({ inside: INSIDES, tail: TAILS }, ({ inside = ``, tail = `` }) => `${inside}${tail}`),
	],
	{
		declaration: (value) => `a { width: ${value}; }`,
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
