/**
 * A Less variable whose colon carries no whitespace in front of it, so that the parser welds the first word of the value into the at-rule's name.
 *
 * Written for [#649](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/649). What decides where the value is split is the character standing right behind the colon and the one that ends the at-word, so the heads cross a dimension with an address, an escaped string, a call, a reference, a second colon, a bang flag and a unit whose upper case is one character longer, which moves the boundary the write splits at. The raw behind the head is spelled with nothing, a space, a tab, a break and a comment, and the tails are what the params then hold.
 *
 * The spellings with whitespace in front of the colon are the control of the split: the parser keeps the whole value in the params there, and the branch must read them exactly as the base does. So are the at-rules that are no variable — a feature query, a media query, an import, a mixin call, and the page at-rule with a block and without one, which tells a node the reading answers no for from one it answers yes for.
 *
 * `color-hex-case` is swept over the same corpus, being the other rule that recases what it reads, and `at-rule-name-case` because this is the one reading that writes an at-rule's name.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands right behind the colon, up to the character that ends the at-word. */
const HEADS = {
	dimension: `10PX`,
	lowerDimension: `10px`,
	hyphenated: `10PX-2REM`,
	exponent: `1E5PX`,
	flagged: `10PX!important`,
	secondColon: `:10PX`,
	address: `url(10PX)`,
	escapedString: `~"10PX"`,
	call: `e("10PX")`,
	reference: `@a`,
	keyword: `pink`,
	// Its upper case is one character longer, so where the head ends moves with the fix
	sharpS: `10A\u00DF`,
}

/** Between the head and the params: what the parser files into `raws.afterName`. */
const BETWEENS = { "none": ``, "space": ` `, "tab": `\t`, "break": `\n`, "comment": ` /* c */ ` }

/** What the params then hold. */
const TAILS = { none: ``, dimension: `2EM`, lowerDimension: `2em`, dimensionAndComment: `2EM /* c */ 3REM`, flag: `!important`, hex: `#FFF`, keyword: `a` }

/** Where the declaration stands. `§` is the declaration, `¶` its use. */
const PLACES = {
	root: `§;\n¶\n`,
	block: `a {\n\t§;\n\tb: 1PX;\n}\n`,
	blockLast: `a {\n\t§\n}\n`,
}

const name: Sweep[`name`] = `less-variable-name`

const corpus: Sweep[`corpus`] = [
	...multiply({ head: HEADS, between: BETWEENS, tail: TAILS }, ({ head = ``, between = ``, tail = `` }) => `@v:${head}${between}${tail}`)
		.flatMap(([key, declaration]) => Object.entries(PLACES).map(([placeName, template]) => [`${placeName}|${key}`, template.replace(`§`, declaration).replace(`¶`, `b { c: @v }`)] as [string, string])),
	// The whitespace in front of the colon keeps the whole value in the params: the split the branch adds cannot reach these
	[`control|spaced`, `@v : 10PX 1px;\nb { c: @v }\n`],
	[`control|spacedNoneBehind`, `@v :10PX 1px;\nb { c: @v }\n`],
	[`control|marked`, `@v: 10PX 1px;\nb { c: @v }\n`],
	[`control|markedComment`, `@v:/* c */10PX 1px;\nb { c: @v }\n`],
	// At-rules that are no variable declaration, and the page at-rule both ways
	[`control|supports`, `@supports (width: 10PX) { a { b: c } }\n`],
	[`control|media`, `@media (min-width: 10PX) { a { b: c } }\n`],
	[`control|import`, `@import "a10PX.less";\n`],
	[`control|mixinCall`, `.m(10PX);\n`],
	[`control|pageBlock`, `@page:first { margin: 10PX }\n`],
	[`control|pageBodiless`, `@page:first;\n`],
	[`control|pageBlockUnit`, `@page:10PX { margin: 0 }\n`],
	[`control|mediaBlockUnit`, `@media:10PX { a { b: c } }\n`],
	[`control|detachedRuleset`, `@dr : { width: 10PX };\nb { @dr(); }\n`],
]

const configs: Sweep[`configs`] = [
	{ rule: `unit-case`, primary: `lower` },
	{ rule: `unit-case`, primary: `upper` },
	{ rule: `color-hex-case`, primary: `lower` },
	{ rule: `color-hex-case`, primary: `upper` },
	{ rule: `at-rule-name-case`, primary: `lower` },
	{ rule: `at-rule-name-case`, primary: `upper` },
]

export { configs, corpus, name }
