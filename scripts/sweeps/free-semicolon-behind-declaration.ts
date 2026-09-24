/**
 * A free semicolon behind a declaration's semicolon, which the parser files in the leading raw of the node behind it, under the two rules writing the run behind a declaration's semicolon.
 *
 * PostCSS keeps a semicolon standing alone inside a block, with the whitespace around it, in the next node's `raws.before`, and both rules read it as the character behind the run they judge; a fix writing that raw whole takes it away. The axes: the block the declarations stand in; its lineness, which the `-single-line` and `-multi-line` options part on; the run behind the declaration's semicolon; and what stands behind the run, since `declaration-block-semicolon-newline-after` reads past a comment. The runs holding no semicolon are the controls.
 */

import { keysOf, multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The two rules speaking of the run behind a declaration's semicolon. */
const RULES = [
	`declaration-block-semicolon-newline-after`,
	`declaration-block-semicolon-space-after`,
]

/** The block: `§` the declarations with the run between them. */
const PLACES: Record<string, string> = {
	rule: `a {§}⏎`,
	atRule: `@media (x) {§}⏎`,
	nestedRule: `@media (x) {⏎\ta {§}⏎}⏎`,
}

/** How the block is laid out: `¶` the run behind the first declaration's semicolon, `‡` what stands behind the run. */
const LAYOUTS: Record<string, string> = {
	singleLine: ` b: c;¶‡ `,
	multiLine: `⏎\tb: c;¶‡⏎\tf: g;⏎`,
}

/** The run behind the declaration's semicolon; the three without a semicolon are the controls. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	lineBreak: `⏎\t`,
	abutting: `;`,
	abuttingThenSpace: `; `,
	abuttingThenBreak: `;⏎\t`,
	behindASpace: ` ;`,
	spaced: ` ; `,
	behindASpaceThenBreak: ` ;⏎\t`,
	behindABreak: `⏎\t; `,
	twice: `;;`,
	twiceSpaced: ` ; ; `,
}

/** What stands behind the run. */
const NEXTS: Record<string, string> = {
	declaration: `d: e;`,
	comment: `/* h */ d: e;`,
	rule: `i {}`,
}

const name: Sweep[`name`] = `free-semicolon-behind-declaration`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), layout: keysOf(LAYOUTS), run: keysOf(RUNS), next: keysOf(NEXTS) }, ({ place, layout, run, next }) => {
	let template = PLACES[place ?? ``]
	let block = LAYOUTS[layout ?? ``]
	let filling = RUNS[run ?? ``]
	let behind = NEXTS[next ?? ``]

	if (template === undefined || block === undefined || filling === undefined || behind === undefined) throw new Error(`Every axis names a value`)

	return template.replace(`§`, block.replace(`¶`, filling).replace(`‡`, behind)).replaceAll(`⏎`, `\n`)
})

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
