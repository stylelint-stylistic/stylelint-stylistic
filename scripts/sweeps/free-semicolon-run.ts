/**
 * A run of empty lines in front of a free semicolon standing behind a rule's closing brace, under `max-empty-lines`.
 *
 * Written for [#584](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/584): PostCSS files such a semicolon, with the whitespace in front of it, in the rule's `raws.ownSemicolon`, a raw the fix's walk never read, so the run was reported and never written, and `--fix` returned the file with the warning gone.
 *
 * The axes: where the rule stands and what follows the semicolon, since the run behind it lands in another raw and is the row's own control; what the rule's block holds; the run's length; what stands inside it; whether the semicolon is there at all, the shapes without one being the controls; and the break spelling.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the rule stands: `§` its block, `¶` the run in front of the semicolon, `‡` the semicolon. The run behind the semicolon lands in the next node's `raws.before` or in the block's `raws.after`, both written before this branch. */
const PLACES: Record<string, string> = {
	top: `a {⏎\t§⏎}¶‡⏎`,
	topThenRule: `a {⏎\t§⏎}¶‡⏎⏎⏎b {}⏎`,
	topThenComment: `a {⏎\t§⏎}¶‡⏎⏎⏎/* c */⏎`,
	nested: `x {⏎\ta {⏎\t\t§⏎\t}¶‡⏎⏎⏎}⏎`,
	nestedThenDeclaration: `x {⏎\ta {⏎\t\t§⏎\t}¶‡⏎⏎⏎\ty: z;⏎}⏎`,
	endOfFile: `a {⏎\t§⏎}¶‡`,
}

/** What the rule's block holds, since the parser hands the raw to a rule however its block is spelled. */
const BLOCKS: Record<string, string> = {
	nothing: ``,
	declaration: `b: c;`,
	nestedRule: `b {}`,
}

/** The run in breaks: two are one empty line, which only zero refuses; four are three, which every primary refuses. */
const LENGTHS: Record<string, number> = {
	two: 2,
	three: 3,
	four: 4,
}

/** A second stray semicolon splits the run in two, and the parser hands the rule the first of them alone; an indentation on every empty line makes them no empty lines to the rule. */
const FILLINGS: Record<string, (run: string) => string> = {
	nothing: (run) => run,
	straySemicolon: (run) => `${run};${run}`,
	indented: (run) => run.replaceAll(`⏎`, `⏎\t`).replace(/\t$/u, ``),
}

/** Whether the semicolon stands there; without it the same run is the block's `raws.after` or the next node's `raws.before`, and those are the controls. */
const SEMICOLONS: Record<string, string> = {
	free: `;`,
	none: ``,
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

const name: Sweep[`name`] = `free-semicolon-run`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), block: keysOf(BLOCKS), length: keysOf(LENGTHS), filling: keysOf(FILLINGS), semicolon: keysOf(SEMICOLONS), lineBreak: keysOf(BREAKS) }, ({ place, block, length, filling, semicolon, lineBreak }) => {
	let template = PLACES[place ?? ``]
	let inside = BLOCKS[block ?? ``]
	let breaks = LENGTHS[length ?? ``]
	let fill = FILLINGS[filling ?? ``]
	let mark = SEMICOLONS[semicolon ?? ``]
	let spell = BREAKS[lineBreak ?? ``]

	if (template === undefined || inside === undefined || breaks === undefined || !fill || mark === undefined || !spell) throw new Error(`Every axis names a value`)

	return spell(template.replace(`§`, inside).replace(`¶`, fill(`⏎`.repeat(breaks))).replace(`‡`, mark))
})

/** The primaries `scripts/oracles/options.ts` lists and the zero the core's suite measures. */
const configs: Sweep[`configs`] = [0, 1, 2].map((primary) => ({ rule: `max-empty-lines`, primary }))

export { configs, corpus, name }
