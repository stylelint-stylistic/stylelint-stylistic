/**
 * A comment behind a closing brace, and the run between it and the node behind, under `block-closing-brace-newline-after`.
 *
 * Written for spec 1789508404: the rule reads past a comment ending the brace's line, and where that comment is a `//` one a `never` fix took away the break that ends it and wrote the next node into the comment. The block comment is the control, and plain CSS, which reads no `//` comment, is the control syntax.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const RULE = `block-closing-brace-newline-after`

const name: Sweep[`name`] = `closing-brace-inline-comment`

const corpus: Sweep[`corpus`] = multiply({
	block: {
		singleLine: `a { color: pink; }`,
		multiLine: `a {\n\tcolor: pink;\n}`,
		atRule: `@media (x) {\n\ta { color: pink; }\n}`,
	},
	gap: {
		none: ``,
		space: ` `,
		tab: `\t`,
		lineFeed: `\n`,
	},
	comment: {
		inline: `// c`,
		block: `/* c */`,
		blockThenInline: `/* b */ // c`,
	},
	lineBreak: {
		lineFeed: `\n`,
		windowsPair: `\r\n`,
		carriageReturn: `\r`,
		formFeed: `\f`,
	},
	run: {
		none: ``,
		space: ` `,
		tab: `\t`,
		emptyLine: `\n`,
	},
	next: {
		rule: `b { color: pink; }`,
		comment: `/* d */ b { color: pink; }`,
		end: ``,
	},
}, ({ block, gap, comment, lineBreak, run, next }) => `${block}${gap}${comment}${lineBreak}${run}${next}\n`)

const configs: Sweep[`configs`] = (RULE_OPTIONS[RULE] ?? []).map((primary) => ({ rule: RULE, primary }))

export { configs, corpus, name }
