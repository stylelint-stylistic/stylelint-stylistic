/**
 * An interpolation of every spelling and text, welded to every head and tail a value word carries, under the two recasing rules.
 *
 * Written for [#298](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/298), where `unit-case` recased the name inside `10px#{$a != $b}`, which the parser had cut into words. The controls open no interpolation in plain CSS, since a corpus of interpolations alone is blind to a branch that stops checking where there is none.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const OPENERS: Record<string, string> = { sass: `#{`, less: `@{`, postcssSimpleVars: `$(` }

const CLOSERS: Record<string, string> = { sass: `}`, less: `}`, postcssSimpleVars: `)` }

const TEXTS = { name: `$a`, comparison: `$a != $b`, product: `$m * 2px`, productEndingInDigit: `$n * 2`, twoDimensions: `2px 3rem`, upper: `$A`, upperUnit: `10PX`, unitAlone: `px`, upperUnitAlone: `PX`, sum: `$a + 1`, call: `f($a)`, quoted: `"PX"`, spacedName: ` $a `, hex: `#FFF`, empty: `` }

const HEADS = { none: ``, unit: `10px`, upperUnit: `10PX`, product: `1px*2rem`, bang: `10px!important`, hack: `10px\\9` }

const TAILS = { none: ``, unit: `10px`, upperUnit: `10PX`, unitAlone: `px`, upperUnitAlone: `PX`, spacedUnit: ` 10px` }

/** Values whose braces open no interpolation in plain CSS. */
const CONTROLS: [string, string][] = [
	[`control|comment-pair`, `1px /* { */ 10PX /* } */`],
	[`control|string-pair`, `"{" 10PX "}"`],
	[`control|bare-pair`, `{ 10PX }`],
	[`control|bare-open`, `{ 10PX`],
	[`control|bare-close`, `10PX }`],
	[`control|comment-open`, `1px /* #{ */ 10PX`],
	[`control|comment-close`, `10PX /* } */`],
	[`control|string-open`, `"#{" 10PX`],
	[`control|string-close`, `10PX "}"`],
	[`control|dollar-paren-string`, `"$(" 10PX ")"`],
	[`control|at-brace-comment`, `/* @{ */ 10PX /* } */`],
	[`control|parens`, `(10PX)`],
]

const name: Sweep[`name`] = `interpolation-case`

const corpus: Sweep[`corpus`] = place(
	[
		...multiply({ spelling: OPENERS, text: TEXTS, head: HEADS, tail: TAILS }, ({ spelling, text, head, tail }) => {
			let language = Object.keys(OPENERS).find((key) => OPENERS[key] === spelling)

			if (language === undefined) throw new Error(`No language opens an interpolation with "${spelling}"`)

			return `${head}${spelling}${text}${CLOSERS[language]}${tail}`
		}),
		...CONTROLS,
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
