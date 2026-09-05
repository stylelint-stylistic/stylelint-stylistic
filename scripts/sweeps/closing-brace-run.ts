/**
 * A run of empty lines standing in front of a closing brace, under `max-empty-lines`.
 *
 * Written for #481. The fix of the rule rewrote the whitespace in front of every node, the runs around a comment's text and the tail of the stylesheet, and the run between a block's last node and its closing brace is none of those: it is the block's own `raws.after`, or the tail of the `raws.between` of an at-rule that runs to the brace without a semicolon of its own. The run was reported and never written, and since a fix cannot decline, `--fix` handed the file back as it was with the warnings gone.
 *
 * The axes are where the block stands and what closes it, since the parser files the run by what stands in front of the brace: a declaration with or without its semicolon, an at-rule with or without one, a comment, a mixin call, and nothing at all — which is an empty block. The run is spelled by its length, since the three primaries the rule is measured under draw the line at different counts, by what stands inside it — nothing, a stray semicolon, which PostCSS files into the same raw, or an indentation on every empty line, which is no empty line to the rule and the control of the writer — and by its break, the feed, the Windows pair and the two mixed, which is a control: the check looks for the Windows pair wherever the file holds one, so a run mixing the two spellings is no run of empty lines to it.
 *
 * The control is the same run behind the opening brace, which is the `raws.before` of the first node and was written on the base.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the block stands, `§` marking its last node and `¶` the run in front of its closing brace, every break of it included, so that the indentation of a nested brace stands behind the run: a rule, an at-rule, a rule nested in an at-rule, a nested property of Sass, which the core reads as a rule whose selector ends in a colon, and, as the control, the run behind the opening brace of a rule. */
const PLACES: Record<string, string> = {
	rule: `a {⏎\t§¶}⏎`,
	atRule: `@media (x) {⏎\t§¶}⏎`,
	nested: `@media (x) {⏎\ta {⏎\t\t§¶\t}⏎}⏎`,
	nestedProperty: `a {⏎\tfont: {⏎\t\t§¶\t}⏎}⏎`,
	afterOpeningBrace: `a {¶\t§⏎}⏎`,
}

/** What closes the block: a declaration with and without its semicolon, an at-rule with and without one, a comment, a mixin call, which only Less reads, and nothing, which leaves the block empty. */
const LASTS: Record<string, string> = {
	declaration: `b: c;`,
	bareDeclaration: `b: c`,
	atRule: `@include x;`,
	bareAtRule: `@include x`,
	comment: `/* c */`,
	mixinCall: `.m()`,
	none: ``,
}

/** How long the run is, in breaks: two breaks are one empty line, which the primary of zero alone refuses; four are three, which every primary measured refuses. */
const LENGTHS: Record<string, number> = {
	two: 2,
	three: 3,
	four: 4,
}

/** What stands inside the run: nothing, a stray semicolon between two runs of the length, and an indentation on every empty line, which makes the lines no empty lines to the rule. */
const FILLINGS: Record<string, (run: string) => string> = {
	nothing: (run) => run,
	straySemicolon: (run) => `${run};${run}`,
	indented: (run) => run.replaceAll(`⏎`, `⏎\t`).replace(/\t$/u, ``),
}

/** How a break is spelled: the feed, the Windows pair, and the two taking turns, which the check reads no empty line in. */
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

/** The rule under the primaries `scripts/oracles/options.ts` lists for it and the zero the core's own suite measures. */
const configs: Sweep[`configs`] = [0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary }))

export { configs, corpus, name }
