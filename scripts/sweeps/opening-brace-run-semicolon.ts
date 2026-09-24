/**
 * A stray semicolon inside the run between a block's opening brace and its first node, under every rule reading that run.
 *
 * The fixes of `block-opening-brace-newline-after` wrote the run in front of the first node that is no comment from its first break on, or emptied it, so a semicolon the parser files in that node's `raws.before` went with the whitespace; and where a comment's break was carried onto the node, the write copied a semicolon out of the comment's run. The axes: where the block stands; what opens it; whether a comment stands in the head, and what its own run holds, since its break is what gets carried; where the semicolon stands inside the node's run; and what closes the block, which decides its lineness. The runs holding no semicolon are the controls under a head that holds none. The mirror of `brace-run-semicolon`, which holds the run in front of the closing brace.
 */

import { keysOf, multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The rules about a block's head that read or write the run there, plus the one whose subject the stray semicolon is. */
const RULES = [
	`block-opening-brace-newline-after`,
	`block-opening-brace-space-after`,
	`indentation`,
	`max-empty-lines`,
	`no-extra-semicolons`,
]

/** Where the block stands: `§` everything behind the opening brace, the closing one included. */
const PLACES: Record<string, string> = {
	rule: `a {§⏎`,
	atRule: `@media (x) {§⏎`,
	nested: `@media (x) {⏎\ta {§⏎}⏎`,
}

/** What stands in the head in front of the node's run: nothing, or a comment behind a run of its own. */
const HEADS: Record<string, string> = {
	bare: ``,
	comment: `/* c */`,
	commentBehindASpace: ` /* c */`,
	commentBehindABreak: `⏎/* c */`,
	commentBehindASpaceAndABreak: ` ⏎/* c */`,
	commentBehindASpaceAndIndentation: ` ⏎\t/* c */`,
	commentBehindASemicolonAndABreak: ` ;⏎/* c */`,
	commentBehindABreakAndASemicolon: ` ⏎;/* c */`,
}

/** The run in front of the first node that is no comment. The first four are the controls, under a head that holds no semicolon either. */
const RUNS: Record<string, string> = {
	none: ``,
	space: ` `,
	lineBreak: `⏎`,
	lineBreakAndIndentation: `⏎\t`,
	semicolon: `;`,
	abutting: `;⏎`,
	behindASpace: ` ;⏎\t`,
	behindABreak: `⏎;`,
	betweenABreakAndASpace: `⏎\t; `,
	withoutABreak: ` ; `,
	twice: `; ;⏎`,
	betweenTwoBreaks: `⏎;⏎`,
	behindASpaceWithAWindowsBreak: ` ;\r⏎`,
}

/** What opens the block. */
const FIRSTS: Record<string, string> = {
	declaration: `b: c;`,
	rule: `b { d: e }`,
	atRule: `@include x;`,
}

/** What closes the block, which decides whether it is one line. */
const TAILS: Record<string, string> = {
	abutting: `}`,
	behindASpace: ` }`,
	behindABreak: `⏎}`,
}

const name: Sweep[`name`] = `opening-brace-run-semicolon`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), head: keysOf(HEADS), run: keysOf(RUNS), first: keysOf(FIRSTS), tail: keysOf(TAILS) }, ({ place, head, run, first, tail }) => {
	let template = PLACES[place ?? ``]
	let opening = HEADS[head ?? ``]
	let filling = RUNS[run ?? ``]
	let node = FIRSTS[first ?? ``]
	let closing = TAILS[tail ?? ``]

	if (template === undefined || opening === undefined || filling === undefined || node === undefined || closing === undefined) throw new Error(`Every axis names a value`)

	return template.replace(`§`, `${opening}${filling}${node}${closing}`).replaceAll(`⏎`, `\n`)
})

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
