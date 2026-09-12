/**
 * A semicolon in the text of a `//` comment behind the last node of a block, which `postcss-less` reads as the semicolon closing that node. `postcss-scss` reads it as comment text; Less does behind an ordinary declaration and a call, and behind a custom property, a variable or an at-rule reads it either way by the value.
 *
 * Written for [#359](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/359). The comment's text holds one semicolon, two, two apart, one either side of a block comment, and one with a semicolon of code on the line under it; a bare carriage return and a form feed in front of the semicolon are the two breaks the readers part on. The controls hold no semicolon in the comment, or one of code under it; the node also stands in the middle of the block. Every rule under every primary option.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `semicolon-in-comment`

const corpus: Sweep[`corpus`] = multiply({
	node: {
		declaration: `color: pink`,
		flag: `color: pink !important`,
		custom: `--x: pink`,
		customFlag: `--x: pink !important`,
		variable: `@v: pink`,
		detached: `@dr()`,
		atRule: `@include x`,
		mixin: `.m()`,
		extend: `@extend .b`,
	},
	tail: {
		semicolon: ` ;`,
		twoSemicolons: ` ;;`,
		twoApart: ` ; ;`,
		aroundBlockComment: ` ; /* c */ ;`,
		codeBelow: ` ;\n\t;`,
		bareReturn: ` c\r;`,
		formFeed: ` c\f;`,
		none: ` c`,
		codeBelowNone: ` c\n\t;`,
	},
	place: {
		last: `last`,
		middle: `middle`,
	},
}, ({ node, tail, place }) => (place === `last` ? `a {\n\t${node} //${tail}\n}\n` : `a {\n\t${node} //${tail}\n\ttop: 0;\n}\n`))

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
