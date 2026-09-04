/**
 * The semicolon of a bodiless at-rule, wherever the file spells one and wherever it does not.
 *
 * Written for #395. `at-rule-semicolon-space-before` read the at-rule's `raws.between` as the whitespace standing in front of its semicolon, and that raw holds that whitespace only where the file spells a semicolon at all: where it spells none, the parser has run the at-rule to the brace closing its parent or to the end of the file and filed whatever stood there into the same raw. So the corpus is the product of a semicolon standing behind the at-rule and not, of the whitespace in front of the place a semicolon would stand, and of what closes the at-rule — a brace, a sibling, a comment, the end of the file.
 *
 * `at-rule-semicolon-newline-after` is the control: it walks the same at-rules behind the same two guards and reads the raw of the node standing behind one, and a branch about the whitespace in front of that node's semicolon should move no row of it. It asks for a next node before either guard, so it is mute on every text that spells no semicolon — an at-rule the file leaves unclosed is the node its container ends on and has no next — and it speaks only where that next node stands on the semicolon's own line. So what it controls is the other half of the corpus, and the tail spelled on the at-rule's own line is what lets it speak there at all.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The at-rule the semicolon closes: one with parameters, one with parameters broken over two lines, and one with none at all, which PostCSS gives no source end. */
const AT_RULES: Record<string, string> = {
	params: `@import "x"`,
	brokenParams: `@import⏎url("x")`,
	noParams: `@content`,
}

/** The whitespace standing between the parameters and the place a semicolon would close the at-rule at. */
const RUNS: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `⏎`,
}

/** Whether the file spells the semicolon. */
const SEMICOLONS: Record<string, string> = {
	spelled: `;`,
	unspelled: ``,
}

/** What stands behind the at-rule: nothing, a block comment on its own line, one beside it, an inline comment, a declaration below it, one on its own line, another at-rule. The last of those is the one tail that makes a liar of the `unspelled` axis: with no semicolon of its own the at-rule runs on into the line below it, and the parser reads the two as one at-rule closed by the semicolon written there — so the file spells a semicolon after all, and the rule speaks of it rightly. */
const TAILS: Record<string, string> = {
	nothing: ``,
	commentBelow: `⏎/* c */`,
	commentBeside: ` /* c */`,
	inlineComment: `⏎// c`,
	declaration: `⏎color: pink`,
	declarationBeside: ` color: pink`,
	atRule: `⏎@import "y";`,
}

/** Which container closes the at-rule, since that container is what the reading asks about: the root of the file, the root of a file that ends in a break, a rule's block, a rule's block a level deeper, a rule's block whose brace closes on the at-rule's own line, an at-rule's own block, and the block Sass spells a nested property with, which is a declaration carrying children and which only `postcss-scss` reads. */
const PLACES: Record<string, string> = {
	root: `§`,
	rootBreak: `§⏎`,
	block: `a {⏎§⏎}⏎`,
	nested: `@media all {⏎a {⏎§⏎}⏎}⏎`,
	sameLine: `a { § }⏎`,
	atRuleBlock: `@media all {⏎§⏎}⏎`,
	nestedProperty: `a {⏎font: 2px/3px {⏎§⏎}⏎}⏎`,
}

/** The break the file is spelled with, since the column a warning falls on moves with it. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `at-rule-semicolon`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, atRule: AT_RULES, run: RUNS, semicolon: SEMICOLONS, tail: TAILS, lineBreak: LINE_BREAKS }, ({ place = ``, atRule = ``, run = ``, semicolon = ``, tail = ``, lineBreak = `` }) => place.replace(`§`, `${atRule}${run}${semicolon}${tail}`).replaceAll(`⏎`, lineBreak))

/** The rule under both of its options, and its pair's other half as the control. */
const configs: Sweep[`configs`] = [
	{ rule: `at-rule-semicolon-space-before`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `at-rule-semicolon-newline-after`, primary: `always` },
]

export { configs, corpus, name }
