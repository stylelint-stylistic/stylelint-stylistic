/**
 * A bodiless at-rule's semicolon, spelled and unspelled ([#395](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/395)).
 *
 * `at-rule-semicolon-space-before` read `raws.between` as the whitespace before the semicolon, which holds only where one is spelled; otherwise the parser runs the at-rule to its parent's closing brace or the file's end and puts what stood there into the raw. Hence the axes.
 *
 * `at-rule-semicolon-newline-after` is the control: same at-rules, same guards, but it reads the next node's raw, so a branch about the semicolon's whitespace should move no row; the same-line tails let it speak where a semicolon is spelled.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** With parameters, broken over two lines, and with none, which PostCSS gives no source end. */
const AT_RULES: Record<string, string> = {
	params: `@import "x"`,
	brokenParams: `@import⏎url("x")`,
	noParams: `@content`,
}

/** The whitespace before the semicolon. */
const RUNS: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `⏎`,
}

/** Spelled or not. */
const SEMICOLONS: Record<string, string> = {
	spelled: `;`,
	unspelled: ``,
}

/** What follows. The last tail belies `unspelled`: an at-rule without a semicolon runs on into the line below and closes on the one there. */
const TAILS: Record<string, string> = {
	nothing: ``,
	commentBelow: `⏎/* c */`,
	commentBeside: ` /* c */`,
	inlineComment: `⏎// c`,
	declaration: `⏎color: pink`,
	declarationBeside: ` color: pink`,
	atRule: `⏎@import "y";`,
}

/** The closing container. `nestedProperty` is a Sass nested property, which only `postcss-scss` reads. */
const PLACES: Record<string, string> = {
	root: `§`,
	rootBreak: `§⏎`,
	block: `a {⏎§⏎}⏎`,
	nested: `@media all {⏎a {⏎§⏎}⏎}⏎`,
	sameLine: `a { § }⏎`,
	atRuleBlock: `@media all {⏎§⏎}⏎`,
	nestedProperty: `a {⏎font: 2px/3px {⏎§⏎}⏎}⏎`,
}

/** A warning's column moves with it. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `at-rule-semicolon`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, atRule: AT_RULES, run: RUNS, semicolon: SEMICOLONS, tail: TAILS, lineBreak: LINE_BREAKS }, ({ place = ``, atRule = ``, run = ``, semicolon = ``, tail = ``, lineBreak = `` }) => place.replace(`§`, `${atRule}${run}${semicolon}${tail}`).replaceAll(`⏎`, lineBreak))

/** Both options, and the pair's other half as control. */
const configs: Sweep[`configs`] = [
	{ rule: `at-rule-semicolon-space-before`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `at-rule-semicolon-newline-after`, primary: `always` },
]

export { configs, corpus, name }
