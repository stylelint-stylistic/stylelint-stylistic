/**
 * Words holding a multiplication, built of every pair and triple of the parts a value word can carry, in every environment, under the two recasing rules.
 *
 * Written for [#413](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/413) and [#425](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/425), where `unit-case` decided a word's write by a second reading of the whole of it: a refused word kept its warning through every `--fix`, and an accepted one had its variables and exponents recased too.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const PARTS = { upperUnit: `10PX`, unit: `2rem`, letter: `A`, exponent: `2E5`, variable: `$var`, upperVariable: `$VAR`, lessVariable: `@var`, moduleVariable: `ns.$v`, bang: `1PX!important`, hack: `10px\\9`, exponentUnit: `1E5PX`, hex: `#fff`, interpolation: `#{$a}` }

const name: Sweep[`name`] = `unit-write`

const corpus: Sweep[`corpus`] = place(
	[
		...multiply({ first: PARTS, second: PARTS }, ({ first, second }) => `${first}*${second}`),
		...multiply({ first: PARTS, second: PARTS, third: PARTS }, ({ first, second, third }) => `${first}*${second}*${third}`),
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
