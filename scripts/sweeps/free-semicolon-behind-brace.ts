/**
 * A free semicolon behind a closing brace that the parser files in the leading raw of the node behind it, under the two rules writing the run behind a brace.
 *
 * PostCSS keeps the first semicolon behind a rule's brace, with the whitespace in front of it, in the rule's `raws.ownSemicolon`; any semicolon behind an at-rule's brace, and every further one behind a rule's, lands in the next node's `raws.before` together with the whitespace around it, where a fix writing that raw whole takes it away. The axes: what the block is, since that decides which raw the first semicolon lands in; its lineness, which the `-single-line` and `-multi-line` options part on; the run behind the brace; and what stands behind the run, a comment on the brace's line being what `block-closing-brace-newline-after` reads past. The runs holding no semicolon are the controls.
 */

import { keysOf, multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The two rules speaking of the run behind a closing brace. */
const RULES = [
	`block-closing-brace-newline-after`,
	`block-closing-brace-space-after`,
]

/** The block: `§` what it holds, `¶` the run behind its brace, `‡` what stands behind the run. */
const PLACES: Record<string, string> = {
	rule: `a {§}¶‡`,
	atRule: `@media (x) {§}¶‡`,
	nestedRule: `@media (x) {⏎\ta {§}¶‡⏎}⏎`,
	nestedAtRule: `@media (x) {⏎\t@media (y) {§}¶‡⏎}⏎`,
}

/** What the block holds, which makes it single-line or multi-line. */
const BLOCKS: Record<string, string> = {
	singleLine: ` b: c; `,
	multiLine: `⏎\tb: c;⏎`,
}

/** The run behind the brace; the three without a semicolon are the controls. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	lineBreak: `⏎`,
	abutting: `;`,
	abuttingThenSpace: `; `,
	abuttingThenBreak: `;⏎`,
	behindASpace: ` ;⏎`,
	behindASpaceAbutting: ` ;`,
	twice: `;;⏎`,
	twiceAbutting: `;;`,
	twiceSpaced: `; ;⏎`,
	aroundTheBreak: `;⏎;⏎`,
}

/** What stands behind the run. */
const NEXTS: Record<string, string> = {
	rule: `d {}`,
	comment: `/* e */⏎d {}`,
}

const name: Sweep[`name`] = `free-semicolon-behind-brace`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), block: keysOf(BLOCKS), run: keysOf(RUNS), next: keysOf(NEXTS) }, ({ place, block, run, next }) => {
	let template = PLACES[place ?? ``]
	let holding = BLOCKS[block ?? ``]
	let filling = RUNS[run ?? ``]
	let behind = NEXTS[next ?? ``]

	if (template === undefined || holding === undefined || filling === undefined || behind === undefined) throw new Error(`Every axis names a value`)

	return template.replace(`§`, holding).replace(`¶`, filling).replace(`‡`, behind).replaceAll(`⏎`, `\n`)
})

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
