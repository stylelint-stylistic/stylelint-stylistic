/**
 * The shape of a Less detached ruleset call, `@dr()`, under names Less calls a ruleset by and names it reads as an at-rule in front of the rest.
 *
 * Written for [#724](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/724): the namespace read the second kind as a call, and `declaration-block-trailing-semicolon` under `never` took away the semicolon Less closes it on. The name is a word, the control, or holds a dollar sign, an exclamation mark, an asterisk, a middle dot or a letter outside ASCII; the call stands bare, closed by a semicolon, behind a `//` comment with the semicolon on the next line, the same with a semicolon in the comment's text, and with whitespace in front of its semicolon; it ends the block or a declaration follows. Every rule under every primary option.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `detached-call-name`

const corpus: Sweep[`corpus`] = multiply({
	name: {
		word: `dr`,
		dollar: `dr$`,
		bang: `d!r`,
		star: `d*r`,
		dot: `d·r`,
		umlaut: `dÄ`,
	},
	form: {
		bare: `@N()`,
		closed: `@N();`,
		comment: `@N() // c\n\t;`,
		commentSemicolon: `@N() // ;\n\t;`,
		spaced: `@N()  ;`,
	},
	place: {
		last: `last`,
		middle: `middle`,
	},
}, ({ name: callName, form, place }) => {
	let node = (form ?? ``).replaceAll(`N`, callName ?? ``)

	return place === `last` ? `a {\n\t${node}\n}\n` : `a {\n\t${node}\n\ttop: 0;\n}\n`
})

// An array primary is a whole setting: primary, then secondary options
const configs: Sweep[`configs`] = Object.entries(RULE_OPTIONS).flatMap(([rule, primaries]) => primaries.map((primary) => (Array.isArray(primary) ? { rule, primary: primary[0] as unknown, secondary: primary[1] as object } : { rule, primary })))

export { configs, corpus, name }
