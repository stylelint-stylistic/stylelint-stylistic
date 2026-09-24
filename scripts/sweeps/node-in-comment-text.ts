/**
 * A node standing wholly in the rest of the text of a `//` comment a semicolon of that text closed the node in front in, which `postcss-less` reads as a node of its own and Less as the comment.
 *
 * The node in front is a declaration with and without an important flag, a bare custom property, a mixin call and a detached ruleset call; the rest of the line holds a declaration with and without its semicolon, two of them, one beside a block comment, a rule, and a mixin call with and without its semicolon; the line ends the block or a declaration follows it. Every rule under every primary option.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `node-in-comment-text`

const corpus: Sweep[`corpus`] = multiply({
	node: {
		declaration: `color: pink`,
		flag: `color: pink !important`,
		custom: `--x: pink`,
		mixin: `.m()`,
		detached: `@dr()`,
	},
	rest: {
		declaration: ` top: 0`,
		closed: ` top: 0;`,
		two: ` top: 0; left: 0`,
		twoClosed: ` top: 0; left: 0;`,
		comment: ` top: 0; /* c */`,
		rule: ` .b { c: d }`,
		mixin: ` .n()`,
		mixinClosed: ` .n();`,
	},
	place: {
		last: `last`,
		middle: `middle`,
	},
}, ({ node, rest, place }) => (place === `last` ? `a {\n\t${node} //;${rest}\n}\n` : `a {\n\t${node} //;${rest}\n\tright: 0;\n}\n`))

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
