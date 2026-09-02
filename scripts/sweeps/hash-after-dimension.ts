/**
 * A character an interpolation is spelled with, welded to a dimension where no interpolation stands, in every environment a value stands in, under the two rules that recase what they read.
 *
 * Written for #426, where `unit-case` cut every such character out of the copy it read a word in, glued `10px` to `fff` and named `pxfff` the unit of `10px#fff` — recasing the hash along with the unit. The characters are welded behind the dimension, in front of it, and between the parts of a multiplication, since the reader reads such a word part by part and the writer has to cut where the reader did; the empty glue is the control, so that every head is also measured with nothing welded to it. An escaped hash is among the glues on purpose: to the tokenizer it is a code point of the identifier, so `10px\#fff` is one dimension token, and what this sweep says of it belongs to #414 rather than here.
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
		// The glue welded to the first part of a product, in front of its star
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
