/**
 * A run of empty lines in front of a closing brace, under `max-empty-lines`.
 *
 * Written for [#481](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481): the run between a block's last node and its closing brace is the block's `raws.after`, or the tail of an at-rule's `raws.between` where it has no semicolon, so the fix reported it and never wrote it, and `--fix` returned the file with the warnings gone.
 *
 * The axes: where the block stands and what closes it, since the parser files the run by what is in front of the brace; the run's length; what stands inside it; and its break spelling. The controls are the mixed spelling and the run behind the opening brace, which the base wrote.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the block stands: `§` the last node, `¶` the run in front of the closing brace. The Sass nested property is a rule whose selector ends in a colon to the core; the last place is the control. */
const PLACES: Record<string, string> = {
	rule: `a {⏎\t§¶}⏎`,
	atRule: `@media (x) {⏎\t§¶}⏎`,
	nested: `@media (x) {⏎\ta {⏎\t\t§¶\t}⏎}⏎`,
	nestedProperty: `a {⏎\tfont: {⏎\t\t§¶\t}⏎}⏎`,
	afterOpeningBrace: `a {¶\t§⏎}⏎`,
}

/** What closes the block; only Less reads the mixin call, and `none` leaves the block empty. */
const LASTS: Record<string, string> = {
	declaration: `b: c;`,
	bareDeclaration: `b: c`,
	atRule: `@include x;`,
	bareAtRule: `@include x`,
	comment: `/* c */`,
	mixinCall: `.m()`,
	none: ``,
}

/** The run in breaks: two are one empty line, which only zero refuses; four are three, which every primary refuses. */
const LENGTHS: Record<string, number> = {
	two: 2,
	three: 3,
	four: 4,
}

/** A stray semicolon splits the run in two; an indentation on every empty line makes them no empty lines to the rule. */
const FILLINGS: Record<string, (run: string) => string> = {
	nothing: (run) => run,
	straySemicolon: (run) => `${run};${run}`,
	indented: (run) => run.replaceAll(`⏎`, `⏎\t`).replace(/\t$/u, ``),
}

/** The break spelling; the check reads no empty line in the mixed one. */
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

const name: Sweep[`name`] = `closing-brace-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), last: keysOf(LASTS), length: keysOf(LENGTHS), filling: keysOf(FILLINGS), lineBreak: keysOf(BREAKS) }, ({ place, last, length, filling, lineBreak }) => {
	let template = PLACES[place ?? ``]
	let closing = LASTS[last ?? ``]
	let breaks = LENGTHS[length ?? ``]
	let fill = FILLINGS[filling ?? ``]
	let spell = BREAKS[lineBreak ?? ``]

	if (template === undefined || closing === undefined || breaks === undefined || !fill || !spell) throw new Error(`Every axis names a value`)

	return spell(template.replace(`§`, closing).replace(`¶`, fill(`⏎`.repeat(breaks))))
})

/** The primaries `scripts/oracles/options.ts` lists and the zero the core's suite measures. */
const configs: Sweep[`configs`] = [0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary }))

export { configs, corpus, name }
