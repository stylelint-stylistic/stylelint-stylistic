/**
 * An opening brace behind a `//` comment ending a rule's selector or an at-rule's params, under both rules writing the run in front of the brace.
 *
 * `postcss-less` keeps such a comment in the selector or params and only the break closing it in `raws.between`, so a guard reading `between` alone let the space or the brace be written into the comment. The block comment and the bare head are the control, and `postcss-scss`, which files the comment in `between`, is the control syntax.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** The two rules writing the run in front of an opening brace. */
const RULES = [
	`block-opening-brace-newline-before`,
	`block-opening-brace-space-before`,
]

const name: Sweep[`name`] = `brace-behind-inline-comment`

const corpus: Sweep[`corpus`] = multiply({
	head: {
		selector: `a`,
		compound: `a > b`,
		guard: `.m() when (@a = 1)`,
		media: `@media screen`,
		bareAtRule: `@font-face`,
	},
	comment: {
		none: ``,
		inline: ` // c`,
		inlineGlued: `// c`,
		blockThenInline: ` /* b */ // c`,
		block: ` /* c */`,
	},
	lineBreak: {
		lineFeed: `\n`,
		windowsPair: `\r\n`,
		carriageReturn: `\r`,
	},
	run: {
		none: ``,
		space: ` `,
		tab: `\t`,
		blockComment: `/* d */ `,
	},
	block: {
		singleLine: `{ color: pink; }`,
		multiLine: `{\n\tcolor: pink;\n}`,
	},
}, ({ head, comment, lineBreak, run, block }) => `${head}${comment}${lineBreak}${run}${block}\n`)

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
