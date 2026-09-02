/**
 * Words holding a multiplication, built out of every pair and every triple of parts a value word can carry, in every environment a value stands in, under the two rules that recase what they read.
 *
 * Written for #413 and #425, where `unit-case` decided the write of such a word by a second reading of the whole of it: where that reading refused the word — a `$` variable in front, a Less variable, a reading through a Sass module — a part it had named was never written and the warning outlived every run of `--fix`, and where it read the word, one edit recased everything in it, the name of a variable and the exponent of a number included. The parts are the shapes a part can be: a dimension of either case, a bare letter, a number whose exponent is the only letter in it, a `$` variable of either case, a Less variable, a variable read through a Sass module, a dimension carrying a bang flag, a dimension carrying a hack unit, a dimension whose unit stands behind an exponent, a hash and an interpolation. Every pair and every triple is a word, so that a part named stands first, last and between two others, and beside every other kind of part.
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
