/**
 * Code behind a bare carriage return in a `//` comment standing behind the last node of a block, which `postcss-less` keeps as the comment's text and Less reads as code, since it closes the comment on the carriage return.
 *
 * The node is closed by a semicolon, since without one the parser takes the comment into the node. Behind the carriage return stand a declaration, a mixin call, a nested rule, a semicolon, two of them, a semicolon and a declaration, a second `//` comment, alone, with a declaration behind another carriage return or behind a semicolon, and a block comment holding a semicolon, with a semicolon or a declaration behind it; the controls hold a line feed, a Windows break, a form feed, and nothing. The comment holds a word in front of the break, a space alone, which the parser keeps in `raws.left`, or nothing, and stands on the node's line or on a line of its own. Every rule under every primary option.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `code-behind-bare-return`

const corpus: Sweep[`corpus`] = multiply({
	node: {
		declaration: `color: pink`,
		flag: `color: pink !important`,
		custom: `--x: pink`,
		variable: `@v: pink`,
		mixin: `.m()`,
		extend: `@extend .b`,
	},
	tail: {
		declaration: `\r top: 0;`,
		declarationBare: `\r\ttop: 0`,
		mixin: `\r .n();`,
		rule: `\r b { top: 0; }`,
		semicolon: `\r;`,
		twoSemicolons: `\r ; ;`,
		semicolonThenDeclaration: `\r; top: 0`,
		comment: `\r // d`,
		commentThenDeclaration: `\r // d\r top: 0;`,
		semicolonThenComment: `\r; // d;`,
		blockComment: `\r /* d; */ ;`,
		blockCommentThenDeclaration: `\r /* d */ top: 0;`,
		lineFeed: `\n\ttop: 0;`,
		windows: `\r\n\ttop: 0;`,
		formFeed: `\f top: 0;`,
		none: ``,
	},
	text: {
		word: ` c`,
		space: ` `,
		none: ``,
	},
	place: {
		sameLine: ` `,
		ownLine: `\n\t`,
	},
}, ({ node, tail, text, place }) => `a {\n\t${node};${place}//${text}${tail}\n}\n`)

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
