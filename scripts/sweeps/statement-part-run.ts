/**
 * A run of empty lines between the parts of one statement, under `max-empty-lines`.
 *
 * Written for [#581](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/581): such a run is a rule's, a declaration's or an at-rule's `raws.between`, an at-rule's `raws.afterName`, the tail of the raw a flag stands in, or the tail of the printed value in front of the semicolon, and the fix wrote none of them, so `--fix` reported the run as fixed and returned the file with it.
 *
 * The axes: which raw the run stands in; the run's length; what stands inside it, a comment carrying a run of its own among it; and the break spelling. The controls are the run in front of a node, which the base wrote, and the run inside a comment, which the option ignoring comments keeps every fix off.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the run stands, `¶` marking it; the raw a flag stands in runs from the end of the value through the flag, so three places read it, only Less reads the mixin call, and the last place is the control, a raw the base wrote. */
const PLACES: Record<string, string> = {
	selectorBrace: `a¶{}⏎`,
	atRuleName: `@media¶(x) {}⏎`,
	atRuleParams: `@media (x)¶{}⏎`,
	atRuleSemicolon: `@import "x"¶;⏎`,
	colonBefore: `a {⏎\tb¶: c;⏎}⏎`,
	colonAfter: `a {⏎\tb:¶c;⏎}⏎`,
	valueSemicolon: `a {⏎\tb: c¶;⏎}⏎`,
	customPropertySemicolon: `a {⏎\t--b: c¶;⏎}⏎`,
	flagBefore: `a {⏎\tb: c¶!important;⏎}⏎`,
	flagInside: `a {⏎\tb: c !¶important;⏎}⏎`,
	flagSemicolon: `a {⏎\tb: c !important¶;⏎}⏎`,
	bareAtRuleSemicolon: `a {⏎\t@include x¶;⏎}⏎`,
	mixinFlagSemicolon: `a {⏎\t.m() !important¶;⏎}⏎`,
	nodeBefore: `a {}¶b {}⏎`,
}

/** The run in breaks: two are one empty line, which only zero refuses; four are three, which every primary refuses. */
const LENGTHS: Record<string, number> = {
	two: 2,
	three: 3,
	four: 4,
}

/** What stands inside the run: a comment parts it in two, one carrying a run of its own is the text no fix may write into, and an indentation on every empty line makes them no empty lines to the rule. */
const FILLINGS: Record<string, (run: string) => string> = {
	nothing: (run) => run,
	comment: (run) => `${run}/* c */${run}`,
	commentHoldingARun: (run) => `${run}/* c⏎⏎⏎⏎d */${run}`,
	indented: (run) => run.replaceAll(`⏎`, `⏎\t`).replace(/\t$/u, ``),
}

/** The break spelling; a line feed is a break whatever stands in front of it, so the mixed one is one run as PostCSS counts it. */
const BREAKS: Record<string, (text: string) => string> = {
	lf: (text) => text.replaceAll(`⏎`, `\n`),
	crlf: (text) => text.replaceAll(`⏎`, `\r\n`),
	mixed: (text) => {
		let count = 0

		return text.replaceAll(`⏎`, () => {
			count += 1

			return count % 2 === 1 ? `\r\n` : `\n`
		})
	},
}

const name: Sweep[`name`] = `statement-part-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), length: keysOf(LENGTHS), filling: keysOf(FILLINGS), lineBreak: keysOf(BREAKS) }, ({ place, length, filling, lineBreak }) => {
	let template = PLACES[place ?? ``]
	let breaks = LENGTHS[length ?? ``]
	let fill = FILLINGS[filling ?? ``]
	let spell = BREAKS[lineBreak ?? ``]

	if (template === undefined || breaks === undefined || !fill || !spell) throw new Error(`Every axis names a value`)

	return spell(template.replace(`¶`, fill(`⏎`.repeat(breaks))))
})

/** The primaries `scripts/oracles/options.ts` lists, the zero the core's suite measures, and the option that reads a copy with the comments blanked. */
const configs: Sweep[`configs`] = [...[0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary })), { rule: `max-empty-lines`, primary: 1, secondary: { ignore: [`comments`] } }]

export { configs, corpus, name }
