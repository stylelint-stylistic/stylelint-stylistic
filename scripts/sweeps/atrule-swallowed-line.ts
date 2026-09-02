/**
 * A line an at-rule swallowed: a comment standing between the params of an at-rule that carries neither a block nor a semicolon and the brace closing its block, which the parser files into the at-rule's `raws.between` rather than into a node of its own.
 *
 * Written for #375. `indentation` measured such a line with the at-rule's params and reported it at the right position, and its writer knew two raws, `afterName` and the params, so the fix for a position behind the params was written onto the end of the params — onto the at-rule's own line — and the file grew a level on every run.
 *
 * The controls are the same block with a semicolon behind the at-rule, and with a declaration in place of it: there the comment is a node of the block, measured off its own `raws.before`, and a branch that moves either row has done something other than it meant to.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The statement closing the block. The first three carry neither a block nor a semicolon and run to the brace; the last two are the controls. */
const STATEMENTS: Record<string, string> = {
	extend: `@extend .b`,
	includeCall: `@include m(1px)`,
	includeBrokenCall: `@include m(⏎1px)`,
	extendSemicolon: `@extend .b;`,
	declaration: `color: pink;`,
}

/** What stands between the statement and the brace: a block comment at the level of the block, the same a level deeper — where `except: ["param"]` and `ignore: ["param"]` part from the default, which asks the params' level of it — an inline one, two comments, a comment on the statement's line and one below it, or nothing. */
const SWALLOWED: Record<string, string> = {
	block: `⏎\t/* c */`,
	blockDeeper: `⏎\t\t/* c */`,
	inline: `⏎\t// c`,
	two: `⏎\t/* c */⏎\t/* d */`,
	besideAndBelow: ` /* x */⏎\t/* c */`,
	none: ``,
}

/** The run in front of the closing brace: a break, which puts the brace at the level of its block, a break and one or two tabs more than that, or nothing, the brace closing on the last line of the body. */
const TAILS: Record<string, string> = {
	"break": `⏎`,
	"indented": `⏎\t`,
	"deeper": `⏎\t\t`,
	"sameLine": ``,
}

/** The break the file is spelled with. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

/** Where the block stands: at the root, or inside a media query, a level deeper. */
const PLACES: Record<string, string> = {
	root: `a {⏎\t§}⏎`,
	nested: `@media x {⏎\ta {⏎\t\t§}⏎}⏎`,
}

const name: Sweep[`name`] = `atrule-swallowed-line`

/**
 * Indents every line of a text by one tab, for the nested place.
 * @param text - The text, its lines marked with the placeholder break.
 * @returns The text with a tab behind every placeholder.
 */
function indentLines (text: string): string {
	return text.replaceAll(`⏎`, `⏎\t`)
}

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, statement: STATEMENTS, swallowed: SWALLOWED, tail: TAILS, lineBreak: LINE_BREAKS }, ({ place = ``, statement = ``, swallowed = ``, tail = ``, lineBreak = `` }) => {
	let body = `${statement}${swallowed}${tail}`

	return place.replace(`§`, place === PLACES.nested ? indentLines(body) : body).replaceAll(`⏎`, lineBreak)
})

/** The rule under both spellings of its primary, and under the secondary options that move the level a param or a closing brace is asked to stand at. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { indentClosingBrace: true } },
]

export { configs, corpus, name }
