/**
 * An escape in front of a delimiter the rules outside the search copies read the run beside: the colon of a declaration, a separator solidus, the comma of a call, a combinator, an attribute operator, a bracket, a parenthesis, a brace and a semicolon.
 *
 * Written for 1789661964, where these rules read the run over the text or over a node's text, so an escaped space passed for a run: `never` took it away; `always` cut a real run behind the escape down to its own space where the writer read the text, and reported without writing where the parser held the escape in the word. The escaped character stands behind one to three backslashes, since the run's parity decides whether it is escaped: a space, a tab, two spaces so that a real run follows the escape, a space and a break for the lineness options, and a hexadecimal comma closed by a space, by two, by three, by a break and by nothing; the whitespace closing a hexadecimal escape is a run to both sides, and three spaces reach past the raw a rule writes into, since PostCSS keeps the closing space in a property. The `-after` twins read the same texts with the escape behind the delimiter, and `indentation` reads the run in front of a semicolon through the same writer.
 *
 * A bare break behind the backslashes, alone and with a space, was added for 1789664271, where the backslash is the delimiter itself and the character a write puts behind it is read as its escape; the brace, bracket and parenthesis shapes and the rules reading their runs came with it.
 *
 * The controls: `value-list-comma-space-before`, which reads its run over the search copy already (1789657288), and `declaration-bang-space-before`.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The backslashes in front of the escaped character: an escape, an escaped backslash, and an escape behind one. */
const BACKSLASHES: Record<string, string> = {
	one: `\\`,
	two: `\\\\`,
	three: `\\\\\\`,
}

/** What the backslashes are written in front of, and what stands between it and the delimiter. */
const ESCAPED: Record<string, string> = {
	bareBreak: `\n`,
	breakThenSpace: `\n `,
	space: ` `,
	twoSpaces: `  `,
	spaceThenBreak: ` \n`,
	tab: `\t`,
	tabThenSpace: `\t `,
	hexComma: `2c`,
	hexCommaThenSpace: `2c `,
	hexCommaThenTwoSpaces: `2c  `,
	hexCommaThenThreeSpaces: `2c   `,
	hexCommaThenBreak: `2c\n`,
}

const name: Sweep[`name`] = `escaped-run`

const corpus: Sweep[`corpus`] = place(
	multiply({ backslashes: BACKSLASHES, escaped: ESCAPED }, ({ backslashes = ``, escaped = `` }) => `${backslashes}${escaped}`),
	{
		colon: (text) => `a { b${text}:c; d: e }`,
		colonAfter: (text) => `a { b:${text}c; d: e }`,
		slash: (text) => `a { b: 1${text}/2; c: d }`,
		slashAfter: (text) => `a { b: 1/${text}2; c: d }`,
		mediaSlash: (text) => `@media (a: 1${text}/2) { b { c: d } }`,
		call: (text) => `a { b: f(1${text},2); c: d }`,
		callAfter: (text) => `a { b: f(1,${text}2); c: d }`,
		combinator: (text) => `a${text}>b { c: d }`,
		combinatorAfter: (text) => `a>${text}b { c: d }`,
		attribute: (text) => `[a${text}=b] { c: d }`,
		attributeAfter: (text) => `[a=${text}b] { c: d }`,
		bracket: (text) => `[a=b${text}] { c: d }`,
		parenthesis: (text) => `a:not(b${text}) { c: d }`,
		openingBrace: (text) => `a${text}{ b: c }`,
		closingBrace: (text) => `a { b: c${text}}`,
		semicolon: (text) => `a { b: 1${text}; c: d }`,
		lastSemicolon: (text) => `a { b: 1${text}; }`,
		flagSemicolon: (text) => `a { b: 1${text} !important; c: d }`,
		atRuleSemicolon: (text) => `@import "x"${text};`,
		block: (text) => `a {\n\tb: 1${text};\n\tc: d;\n}`,
	},
)

/** Every rule reading the run beside one of these delimiters, under each option, and the controls. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-colon-space-before`, primary: `always` },
	{ rule: `declaration-colon-space-before`, primary: `never` },
	{ rule: `declaration-colon-space-after`, primary: `always` },
	{ rule: `declaration-colon-space-after`, primary: `never` },
	{ rule: `declaration-colon-newline-after`, primary: `always` },
	{ rule: `declaration-colon-newline-after`, primary: `always-multi-line` },
	{ rule: `value-slash-space-before`, primary: `always` },
	{ rule: `value-slash-space-before`, primary: `never` },
	{ rule: `value-slash-space-after`, primary: `always` },
	{ rule: `value-slash-space-after`, primary: `never` },
	{ rule: `value-slash-newline-before`, primary: `always` },
	{ rule: `value-slash-newline-before`, primary: `always-multi-line` },
	{ rule: `value-slash-newline-before`, primary: `never-multi-line` },
	{ rule: `value-slash-newline-after`, primary: `always` },
	{ rule: `value-slash-newline-after`, primary: `always-multi-line` },
	{ rule: `value-slash-newline-after`, primary: `never-multi-line` },
	{ rule: `media-feature-slash-space-before`, primary: `always` },
	{ rule: `media-feature-slash-space-before`, primary: `never` },
	{ rule: `media-feature-slash-space-after`, primary: `always` },
	{ rule: `media-feature-slash-space-after`, primary: `never` },
	{ rule: `function-comma-space-before`, primary: `always` },
	{ rule: `function-comma-space-before`, primary: `never` },
	{ rule: `function-comma-space-after`, primary: `always` },
	{ rule: `function-comma-space-after`, primary: `never` },
	{ rule: `function-comma-newline-before`, primary: `always` },
	{ rule: `function-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `function-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `function-comma-newline-after`, primary: `always` },
	{ rule: `function-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `function-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `selector-combinator-space-before`, primary: `always` },
	{ rule: `selector-combinator-space-before`, primary: `never` },
	{ rule: `selector-combinator-space-after`, primary: `always` },
	{ rule: `selector-combinator-space-after`, primary: `never` },
	{ rule: `selector-attribute-operator-space-before`, primary: `always` },
	{ rule: `selector-attribute-operator-space-before`, primary: `never` },
	{ rule: `selector-attribute-operator-space-after`, primary: `always` },
	{ rule: `selector-attribute-operator-space-after`, primary: `never` },
	{ rule: `selector-attribute-brackets-space-inside`, primary: `always` },
	{ rule: `selector-attribute-brackets-space-inside`, primary: `never` },
	{ rule: `selector-pseudo-class-parentheses-space-inside`, primary: `always` },
	{ rule: `selector-pseudo-class-parentheses-space-inside`, primary: `never` },
	{ rule: `block-opening-brace-space-before`, primary: `always` },
	{ rule: `block-opening-brace-space-before`, primary: `never` },
	{ rule: `block-opening-brace-space-before`, primary: `always-single-line` },
	{ rule: `block-opening-brace-space-before`, primary: `never-single-line` },
	{ rule: `block-opening-brace-newline-before`, primary: `always` },
	{ rule: `block-opening-brace-newline-before`, primary: `always-single-line` },
	{ rule: `block-opening-brace-newline-before`, primary: `never-single-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always` },
	{ rule: `block-closing-brace-space-before`, primary: `never` },
	{ rule: `block-closing-brace-space-before`, primary: `always-single-line` },
	{ rule: `block-closing-brace-space-before`, primary: `never-single-line` },
	{ rule: `block-closing-brace-newline-before`, primary: `always` },
	{ rule: `block-closing-brace-newline-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-newline-before`, primary: `never-multi-line` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always-multi-line` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `never-multi-line` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `never` },
	{ rule: `at-rule-semicolon-space-before`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `value-list-comma-space-before`, primary: `always` },
	{ rule: `declaration-bang-space-before`, primary: `never` },
]

export { configs, corpus, name }
