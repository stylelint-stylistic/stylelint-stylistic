/**
 * A word whose dimension is welded to something the unit may not hold, with an escape standing wherever one can stand, in every environment a value stands in.
 *
 * Written for #414, where `unit-case` cut a word at every star `String.prototype.split` found — an escaped one among them — and named `PX\` the unit of `10PX\*2REM`. The star is spelled six ways here, from none through the plain operator to three backslashes in front of it, since the parity of the run decides which of the two a star is; a backslash in front of each of the three line breaks stands beside them, being the one place a backslash opens no escape at all, with an escaped backslash and a Windows pair to say what the parity and the pair do there. Five characters that end a unit without parting the word `postcss-value-parser` hands over stand there too — a percent sign, a dollar, a no-break space, a period and a plus — since a second dimension written behind one of those is a dimension only the grammar sees. Every character that is no code point of an identifier belongs to that class, and `= < > ? ^ ~ | &` and the backtick behave exactly as the percent sign does; the five spelled here are the two a person types and three that stand for the rest. The period and the plus are the two the tokenizer puts no delimiter at all between: `10PX.2REM` and `10PX+2REM` are each two dimension tokens standing next to each other, and `lightningcss` recases the units of both. The escape is also written at the front of the word, between the letters of the unit, at its end and in front of the digit of a hack, so that no row of the sweep is blind to where the backslash stands. Behind the dimension stands each thing a unit ends in front of — a second dimension, a bare word, a Sass or Less variable, a module name, a hash, a brace, a percent sign, a bang flag, a hack unit — escaped and plain, since what ends a unit and what is a character of it is the one question this whole reading turns on.
 *
 * `color-hex-case` is read over the same corpus: it is the other rule that recases what it reads, and the hashes welded here are what it reads.
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
}

const TAILS = { none: ``, dimension: `2REM`, word: `A`, variable: `$VAR`, escapedVariable: `\\$VAR`, module: `ns.$V`, atVariable: `@VAR`, escapedAtVariable: `\\@VAR`, hash: `#FFF`, escapedHash: `\\#FFF`, closingBrace: `}`, escapedClosingBrace: `\\}`, percent: `%`, bang: `!important`, escapedBang: `\\!important`, hack: `\\9` }

const FRONTS = { none: ``, escapedStar: `\\*`, escapedHash: `\\#`, escapedBackslash: `\\\\` }

/**
 * A head whose escape stands somewhere other than in front of the tail: inside the unit, closing the word, or in front of the digit of a hack unit.
 *
 * Five of them are the shape a reading blind to an escape mistakes for a hack: `10PX\\0` is an escaped backslash and a digit, no hack at all, and taking two characters out of the middle of it would leave every escape written behind that point read from the wrong side. The last six carry two and three stars in one word, spelled and escaped in each order, since every other row of this sweep carries one separator and the parity of a star is a question the word answers star by star; two of the six spell two stars the file writes, so that a cut taking only the first of them is a cut the corpus sees. Each of these is multiplied by the tails, so that what follows the mis-cut is measured too.
 */
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
	},
)

const configs: Sweep[`configs`] = [
	{ rule: `unit-case`, primary: `lower` },
	{ rule: `unit-case`, primary: `upper` },
	{ rule: `color-hex-case`, primary: `lower` },
	{ rule: `color-hex-case`, primary: `upper` },
]

export { configs, corpus, name }
