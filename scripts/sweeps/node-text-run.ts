/**
 * A run of empty lines standing inside the text of a node, under `max-empty-lines`.
 *
 * Written for [#582](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/582): such a run is a rule's selector, an at-rule's parameters, a declaration's value or a comment's own text — the node's own text and no raw between the parts of the statement, which is [#581](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/581)'s. The fix wrote none of them, so `--fix` reported the run as fixed and handed the file back holding it.
 *
 * The axes: where the run stands; its length; what stands beside it in the text, a comment or a string holding a run of its own among it; and the break spelling, the fix running a pass per spelling. The controls are the run inside a string, which is text of the string and a line of no stylesheet, the run in front of a node, which the base wrote, and the run inside a comment, which the option ignoring comments keeps every fix off.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the run stands, `¶` marking it; the last two places are the controls, a string's own text and a raw the base wrote. */
const PLACES: Record<string, string> = {
	selectorList: `a,¶b {}⏎`,
	selectorCombinator: `a¶b {}⏎`,
	atRuleParams: `@media (x)¶and (y) {}⏎`,
	atRuleParamsList: `@media (x),¶(y) {}⏎`,
	value: `a {⏎\tb: c¶d;⏎}⏎`,
	valueList: `a {⏎\tb: c,¶d;⏎}⏎`,
	valueFunction: `a {⏎\tb: f(c¶d);⏎}⏎`,
	customPropertyValue: `a {⏎\t--b: c¶d;⏎}⏎`,
	bareAddress: `a {⏎\tb: url(c¶d);⏎}⏎`,
	commentText: `/* a¶b */⏎`,
	commentInValue: `a {⏎\tb: c /* x¶y */ d;⏎}⏎`,
	commentInSelector: `a /* x¶y */ b {}⏎`,
	commentInParams: `@media (x) /* q¶r */ and (y) {}⏎`,
	stringInValue: `a {⏎\tb: "c¶d";⏎}⏎`,
	nodeBefore: `a {}¶b {}⏎`,
}

/** The run in breaks: two are one empty line, which only zero refuses; four are three, which every primary refuses. */
const LENGTHS: Record<string, number> = {
	two: 2,
	three: 3,
	four: 4,
}

/** What stands beside the run in the same text: a comment or a string carrying a run of its own, which is the text no fix writes the run of the stylesheet into, and an indentation on every empty line, which makes them no empty lines to the rule. */
const NEIGHBORS: Record<string, (text: string) => string> = {
	nothing: (text) => text,
	comment: (text) => `/* n⏎⏎⏎⏎m */⏎${text}`,
	string: (text) => `x {⏎\ty: "n⏎⏎⏎⏎m";⏎}⏎${text}`,
	indented: (text) => text.replaceAll(`⏎⏎`, `⏎\t⏎`),
}

/** The break spelling; a line feed is a break whatever stands in front of it, so the mixed one is one run as PostCSS counts it ([#586](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/586)). */
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

const name: Sweep[`name`] = `node-text-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), length: keysOf(LENGTHS), neighbor: keysOf(NEIGHBORS), lineBreak: keysOf(BREAKS) }, ({ place, length, neighbor, lineBreak }) => {
	let template = PLACES[place ?? ``]
	let breaks = LENGTHS[length ?? ``]
	let stand = NEIGHBORS[neighbor ?? ``]
	let spell = BREAKS[lineBreak ?? ``]

	if (template === undefined || breaks === undefined || !stand || !spell) throw new Error(`Every axis names a value`)

	return spell(stand(template.replace(`¶`, `⏎`.repeat(breaks))))
})

/** The primaries `scripts/oracles/options.ts` lists, the zero the core's suite measures, and the option that reads a copy with the comments blanked. */
const configs: Sweep[`configs`] = [...[0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary })), { rule: `max-empty-lines`, primary: 1, secondary: { ignore: [`comments`] } }]

export { configs, corpus, name }
