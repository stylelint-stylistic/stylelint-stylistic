/**
 * Units spelling a code point outside ASCII, alone and beside an ASCII letter of either case, in six environments a unit stands in.
 *
 * Written for [#653](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/653), where `unit-case` recased a unit with `toUpperCase` and `toLowerCase`, so `Aß` became `ASS` and `İ` became `i̇`: another unit, since a unit identifier is ASCII case-insensitive and every other code point is part of it as it stands. The code points cross those whose mapping is not one to one (`ß`, `İ`, `ﬁ`), those whose mapping is one to one but not its own inverse (`ſ`, the Kelvin sign, `ı`) and those whose mapping is a plain pair (`é`, `É`, `Ω`), with a middle dot as the control: a code point of an identifier with no case at all. Each stands alone as the unit, and at the head, in the middle and at the tail of one beside a letter of each case.
 *
 * The ASCII units are the control of the recase: the branch recases them exactly as the base did, so their rows must not move.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The code points outside ASCII. */
const POINTS = {
	sharpS: `ß`,
	dottedI: `İ`,
	ligatureFi: `ﬁ`,
	longS: `ſ`,
	kelvin: `K`,
	dotlessI: `ı`,
	eAcute: `é`,
	EAcute: `É`,
	omega: `Ω`,
	middleDot: `·`,
}

/** The ASCII letters beside them, by case. */
const LETTERS = { lower: `p`, upper: `P` }

/** Where the code point stands in the unit; `§` is the point, `¶` the letter. */
const SHAPES = { head: `§¶`, middle: `¶§¶`, tail: `¶§` }

/** The unit alone, in front of a number. */
const UNITS: [string, string][] = [
	...Object.entries(POINTS).map(([key, point]) => [`alone|${key}`, `10${point}`] as [string, string]),
	...multiply({ point: POINTS, letter: LETTERS, shape: SHAPES }, ({ point = ``, letter = ``, shape = `` }) => `10${shape.replaceAll(`§`, point).replaceAll(`¶`, letter)}`),
	[`control|lower`, `10px`],
	[`control|upper`, `10PX`],
	[`control|mixed`, `10Px`],
	[`control|number`, `10`],
	[`control|percent`, `10%`],
]

const name: Sweep[`name`] = `non-ascii-unit`

const corpus: Sweep[`corpus`] = place(UNITS, {
	declaration: (value) => `a { width: ${value}; }\n`,
	calc: (value) => `a { width: calc(${value} + 1PX); }\n`,
	neighbours: (value) => `a { margin: 1PX ${value} 2px; }\n`,
	media: (value) => `@media (min-width: ${value}) { a { b: c; } }\n`,
	customProperty: (value) => `a { --x: ${value}; }\n`,
	lessVariable: (value) => `@v:${value} 1px;\nb { c: @v; }\n`,
})

const configs: Sweep[`configs`] = [
	{ rule: `unit-case`, primary: `lower` },
	{ rule: `unit-case`, primary: `upper` },
]

export { configs, corpus, name }
