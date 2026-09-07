/**
 * A comment between the params of an at-rule with neither block nor semicolon and the closing brace, which the parser puts in `raws.between`.
 *
 * Written for [#375](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375): `indentation` wrote the fix onto the end of the params, so the file grew a level every run. The controls (a semicolon, a declaration) make the comment a node of its own; the `tail` axis measured [#509](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509).
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The first five have neither block nor semicolon, the last two are controls; `postcss-less` prints a mixin call's `!important` behind `raws.between`, so no rule may write into that run ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)). */
const STATEMENTS: Record<string, string> = {
	extend: `@extend .b`,
	includeCall: `@include m(1px)`,
	includeBrokenCall: `@include m(⏎1px)`,
	mixinCall: `.m()`,
	mixinCallImportant: `.m() !important`,
	extendSemicolon: `@extend .b;`,
	declaration: `color: pink;`,
}

/** `blockDeeper` parts `except: ["param"]` and `ignore: ["param"]` from the default. */
const SWALLOWED: Record<string, string> = {
	block: `⏎\t/* c */`,
	blockDeeper: `⏎\t\t/* c */`,
	inline: `⏎\t// c`,
	two: `⏎\t/* c */⏎\t/* d */`,
	besideAndBelow: ` /* x */⏎\t/* c */`,
	none: ``,
}

/** The run in front of the closing brace. */
const TAILS: Record<string, string> = {
	"break": `⏎`,
	"indented": `⏎\t`,
	"deeper": `⏎\t\t`,
	"sameLine": ``,
}

/** The file's line break. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

/** Where the block stands. */
const PLACES: Record<string, string> = {
	root: `a {⏎\t§}⏎`,
	nested: `@media x {⏎\ta {⏎\t\t§}⏎}⏎`,
}

const name: Sweep[`name`] = `atrule-swallowed-line`

/**
 * Indents every line, for the nested place.
 * @param text - The block's text with marker breaks.
 * @returns The indented text.
 */
function indentLines (text: string): string {
	return text.replaceAll(`⏎`, `⏎\t`)
}

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, statement: STATEMENTS, swallowed: SWALLOWED, tail: TAILS, lineBreak: LINE_BREAKS }, ({ place = ``, statement = ``, swallowed = ``, tail = ``, lineBreak = `` }) => {
	let body = `${statement}${swallowed}${tail}`

	return place.replace(`§`, place === PLACES.nested ? indentLines(body) : body).replaceAll(`⏎`, lineBreak)
})

/** Both primaries, and the secondaries moving a param's or brace's level. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { indentClosingBrace: true } },
]

export { configs, corpus, name }
