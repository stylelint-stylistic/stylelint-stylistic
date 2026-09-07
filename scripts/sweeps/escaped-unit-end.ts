/**
 * A word whose dimension is welded to something the unit may not hold, with an escape wherever one can stand, in every environment of a value.
 *
 * Written for [#414](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414), where `unit-case` split a word at every star, escaped or not, and named `PX\` the unit of `10PX\*2REM`. The star is spelled behind none to three backslashes, since the run's parity decides what it is; a backslash stands in front of each line break, where it opens no escape. Five characters (`%`, `$`, a no-break space, `.`, `+`) end a unit without parting the word `postcss-value-parser` returns, as every non-identifier code point does; `.` and `+` are the two the tokenizer puts no delimiter between. The escape is also written at the front of the word, inside the unit, at its end and in front of a hack's digit, and each thing a unit ends in front of stands behind the dimension, escaped and plain.
 *
 * The whitespace closing a hexadecimal escape belongs to it, but `postcss-value-parser` parts the word there, so nine separators spell an escape and its whitespace ([#526](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526)), and three insides carry one inside the word. The inline-comment environment puts a dimension on the line below, since an escape at the value's end would take the closing break.
 *
 * `color-hex-case` is swept over the same corpus, being the other rule that recases what it reads.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const HEADS = { unit: `10PX`, lowerUnit: `10px`, number: `10`, exponent: `1E5PX`, hack: `10PX\\9`, word: `A`, variable: `$VAR`, interpolation: `#{$A}` }

const SEPARATORS = {
	none: ``,
	star: `*`,
	escapedStar: `\\*`,
	escapedBackslashThenStar: `\\\\*`,
	threeBackslashesThenStar: `\\\\\\*`,
	hackThenStar: `\\9*`,
	backslashThenLineFeed: `\\\n`,
	backslashThenCarriageReturn: `\\\r`,
	backslashThenFormFeed: `\\\f`,
	escapedBackslashThenLineFeed: `\\\\\n`,
	backslashThenWindowsPair: `\\\r\n`,
	percent: `%`,
	dollar: `$`,
	noBreakSpace: `\u00A0`,
	period: `.`,
	plus: `+`,
	hackThenSpace: `\\9 `,
	hackThenTab: `\\9\t`,
	hackThenLineFeed: `\\9\n`,
	hackThenWindowsPair: `\\9\r\n`,
	hackThenTwoSpaces: `\\9  `,
	letterEscapeThenSpace: `\\61 `,
	sixDigitsThenSpace: `\\000061 `,
	sevenDigitsThenSpace: `\\0000611 `,
	escapedBackslashNineThenSpace: `\\\\9 `,
}

const TAILS = { none: ``, dimension: `2REM`, word: `A`, variable: `$VAR`, escapedVariable: `\\$VAR`, module: `ns.$V`, atVariable: `@VAR`, escapedAtVariable: `\\@VAR`, hash: `#FFF`, escapedHash: `\\#FFF`, closingBrace: `}`, escapedClosingBrace: `\\}`, percent: `%`, bang: `!important`, escapedBang: `\\!important`, hack: `\\9` }

const FRONTS = { none: ``, escapedStar: `\\*`, escapedHash: `\\#`, escapedBackslash: `\\\\` }

/** A head whose escape stands inside the unit, at the word's end, or in front of a hack's digit. Five spell a hack behind escaped backslashes, where a cut in the middle misreads every escape behind it; six carry two or three stars in one word, since parity is answered star by star, two of them plain so a cut taking only the first is seen. */
const INSIDES = {
	escapedStarInside: `10P\\*X`,
	escapedHashInside: `10P\\#X`,
	hackInside: `10P\\9X`,
	closingBackslash: `10PX\\`,
	closingEscapedBackslash: `10PX\\\\`,
	escapedSpace: `10PX\\ 2REM`,
	hack: `10PX\\0`,
	hackBehindEscapedBackslash: `10PX\\\\0`,
	hackBehindEscapedBackslashNine: `10PX\\\\9`,
	hackBehindThreeBackslashes: `10PX\\\\\\0`,
	hackBehindEscapedBackslashOnNumber: `10\\\\9`,
	escapedStarThenStar: `10PX\\*2REM*3EM`,
	starThenEscapedStar: `10PX*2REM\\*3EM`,
	twoEscapedStars: `10PX\\*2REM\\*3EM`,
	escapedBackslashStarThenEscapedStar: `10PX\\\\*2REM\\*3EM`,
	twoSpelledStars: `10PX*2REM*3EM`,
	spelledStarsAroundAnEscapedOne: `10PX*2REM\\*3EM*4VW`,
	hexEscapeInsideWelded: `10P\\61 X`,
	hackInsideWelded: `10P\\9 X`,
	hackChain: `10PX\\9 2PX\\9 3PX`,
}

const name: Sweep[`name`] = `escaped-unit-end`

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
