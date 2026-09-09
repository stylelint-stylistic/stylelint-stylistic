/**
 * A Less variable whose value carries a miscased unit, in every spelling of the whitespace around the colon.
 *
 * Written for [#577](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/577), where `unit-case` found a variable's value through the `variable` mark `postcss-less` sets only where the colon closed the name. The colon is spelled with none, one and two spaces, a tab and a line break on either side of it, which is what decides where the parser puts the value: in `params` behind the colon, in `params` alone, or — where no whitespace stands in front of the colon — with its first word welded into the at-rule's name.
 *
 * The values cross what the rule reads with what it must leave alone: a dimension, two of them, one already in the case asked for, a hex colour beside one, a bang flag, an escape, a parenthesised sum, an escaped string and an address. A bare interpolation is not among them: `postcss-less` refuses `@v: @{a}10PX` outright, so no row could carry one. The controls are the at-rules that are no variable and the values holding no unit at all, expected not to move.
 *
 * `color-hex-case` is swept over the same corpus, being the other rule that recases what it reads, and the four at-rule rules that read the same nodes are there to catch what the new answer costs them.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Between the name and the colon; the empty one is the only spelling the parser marks. */
const BEFORES = { "none": ``, "space": ` `, "twoSpaces": `  `, "tab": `\t`, "break": `\n` }

/** Between the colon and the value. */
const AFTERS = { "none": ``, "space": ` `, "twoSpaces": `  `, "tab": `\t`, "break": `\n`, "comment": `/* c */`, "spacedComment": ` /* c */ ` }

/** What the declaration holds. The last two are the control: no unit stands in either. */
const VALUES = {
	dimension: `10PX`,
	twoDimensions: `10PX 2REM`,
	lowerDimension: `10px`,
	hexAndDimension: `#FFF 10PX`,
	flagged: `10PX !important`,
	escapedString: `~"10PX"`,
	address: `url(10PX)`,
	parenthesised: `(10PX + 1px)`,
	escaped: `10PX\\#FFF`,
	keyword: `pink`,
	empty: ``,
}

/** Where the declaration stands. `§` is the declaration and `¶` its use. */
const PLACES = {
	root: `§;\n¶\n`,
	block: `a {\n\t§;\n}\n¶\n`,
	blockLast: `a {\n\t§\n}\n`,
	beforeDeclaration: `a {\n\t§;\n\tb: 1PX;\n}\n`,
}

const name: Sweep[`name`] = `less-variable-value`

const corpus: Sweep[`corpus`] = [
	...multiply({ before: BEFORES, after: AFTERS, value: VALUES }, ({ before = ``, after = ``, value = `` }) => `@v${before}:${after}${value}`)
		.flatMap(([key, declaration]) => Object.entries(PLACES).map(([placeName, template]) => [`${placeName}|${key}`, template.replace(`§`, declaration).replace(`¶`, `b { c: @v }`)] as [string, string])),
	// At-rules that are no variable of Less, and one that is: what the new answer must leave where it stands
	[`control|directive`, `@custom-media :x (min-width: 10PX);\n`],
	[`control|page`, `@page:first { margin: 0 }\n`],
	[`control|pageSpaced`, `@page :first { margin: 0 }\n`],
	[`control|supports`, `@supports (width: 10PX) { a { b: c } }\n`],
	[`control|media`, `@media (min-width: 10PX) { a { b: c } }\n`],
	[`control|import`, `@import "a10PX.less";\n`],
	[`control|detachedRuleset`, `@dr : { width: 10PX };\nb { @dr(); }\n`],
	[`control|mixinCall`, `.m(10PX);\n`],
]

const configs: Sweep[`configs`] = [
	{ rule: `unit-case`, primary: `lower` },
	{ rule: `unit-case`, primary: `upper` },
	{ rule: `color-hex-case`, primary: `lower` },
	{ rule: `color-hex-case`, primary: `upper` },
	{ rule: `at-rule-name-case`, primary: `lower` },
	{ rule: `at-rule-name-space-after`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `no-extra-semicolons`, primary: true },
]

export { configs, corpus, name }
