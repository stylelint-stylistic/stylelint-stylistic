/**
 * A character an interpolation is spelled with, welded to a dimension where no interpolation stands, under the two rules that recase what they read.
 *
 * Written for [#426](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/426), where `unit-case` named `pxfff` the unit of `10px#fff`. The glue stands behind the dimension, in front of it, and inside a product; the empty glue is the control. The escaped hash is here on purpose: `10px\#fff` is one dimension token, which belongs to [#414](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/414).
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const HEADS = { unit: `10px`, upperUnit: `10PX`, bang: `10px!important`, upperBang: `10PX!important`, hack: `10px\\9`, upperHack: `10PX\\9`, number: `10`, exponent: `1E5PX`, unitAlone: `PX` }

const PRODUCTS = { product: `1px*2rem`, upperProduct: `1PX*2REM`, partWithoutUnit: `1PX*A`, variableFirst: `$var*2REM`, bangInside: `10PX!important*2REM` }

const GLUES = { none: ``, hash: `#fff`, upperHash: `#FFF`, at: `@a`, upperAt: `@A`, bracePair: `{a}`, closingBrace: `}`, openingBrace: `{`, escapedHash: `\\#fff` }

const SIDES = { behind: `behind`, ahead: `ahead` }

const name: Sweep[`name`] = `hash-after-dimension`

const corpus: Sweep[`corpus`] = place(
	[
		...multiply({ head: { ...HEADS, ...PRODUCTS }, glue: GLUES, side: SIDES }, ({ head = ``, glue = ``, side }) => (side === `ahead` ? `${glue}${head}` : `${head}${glue}`)),
		// The glue in front of a product's star
		...multiply({ head: PRODUCTS, glue: GLUES, side: { inside: `inside` } }, ({ head = ``, glue = `` }) => head.replace(`*`, `${glue}*`)),
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
