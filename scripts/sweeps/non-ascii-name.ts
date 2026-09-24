/**
 * Names spelling a code point outside ASCII, alone and beside an ASCII letter of either case, wherever one of the six recasing rules reads a name.
 *
 * `property-case`, `at-rule-name-case`, `media-feature-name-case`, `selector-pseudo-class-case`, `selector-pseudo-element-case` and `color-hex-case` recased a name with `toUpperCase` and `toLowerCase`, so `fß` became `FSS` and `Fİ` became `fi̇`: another name, since a name is ASCII case-insensitive and every other code point is part of it as it stands. The code points are those of `non-ascii-unit`, crossed with the letter `f`, which is a hex digit too, so a hash holding it is read by the color rule. Each stands alone as the name, and at the head, in the middle and at the tail of one beside the letter.
 *
 * The ASCII names are the control of the recase: the branch recases them exactly as the base did, so their rows must not move. A hash opening on the code point is a control of another kind: no hex digit opens it, so the color rule reads no color there on either side, except that the `i` flag of `HEX_COLOR` folds the Kelvin sign into `k` and the long s into `s`, so a hash opening on either of those two is read as a color and moves like the rest.
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

/** The ASCII letter beside them, by case. */
const LETTERS = { lower: `f`, upper: `F` }

/** Where the code point stands in the name; `§` is the point, `¶` the letter. */
const SHAPES = { head: `§¶`, middle: `¶§¶`, tail: `¶§` }

/** The name alone. */
const NAMES: [string, string][] = [
	...Object.entries(POINTS).map(([key, point]) => [`alone|${key}`, point] as [string, string]),
	...multiply({ point: POINTS, letter: LETTERS, shape: SHAPES }, ({ point = ``, letter = ``, shape = `` }) => shape.replaceAll(`§`, point).replaceAll(`¶`, letter)),
	[`control|lower`, `ff`],
	[`control|upper`, `FF`],
	[`control|mixed`, `Ff`],
]

const name: Sweep[`name`] = `non-ascii-name`

const corpus: Sweep[`corpus`] = place(NAMES, {
	property: (value) => `a { ${value}: 1px; }\n`,
	atRule: (value) => `@${value} screen { a { b: c; } }\n`,
	mediaFeature: (value) => `@media (${value}: 1px) { a { b: c; } }\n`,
	pseudoClass: (value) => `a:${value} { b: c; }\n`,
	pseudoElement: (value) => `a::${value} { b: c; }\n`,
	hex: (value) => `a { color: #${value}; }\n`,
})

const configs: Sweep[`configs`] = [
	{ rule: `property-case`, primary: `lower` },
	{ rule: `property-case`, primary: `upper` },
	{ rule: `at-rule-name-case`, primary: `lower` },
	{ rule: `at-rule-name-case`, primary: `upper` },
	{ rule: `media-feature-name-case`, primary: `lower` },
	{ rule: `media-feature-name-case`, primary: `upper` },
	{ rule: `selector-pseudo-class-case`, primary: `lower` },
	{ rule: `selector-pseudo-class-case`, primary: `upper` },
	{ rule: `selector-pseudo-element-case`, primary: `lower` },
	{ rule: `selector-pseudo-element-case`, primary: `upper` },
	{ rule: `color-hex-case`, primary: `lower` },
	{ rule: `color-hex-case`, primary: `upper` },
]

export { configs, corpus, name }
