/**
 * An escape in front of a delimiter the rules outside the search copies read the run beside: the colon of a declaration, a separator solidus, the comma of a call, a combinator, an attribute operator, a bracket, a parenthesis, a brace and a semicolon.
 *
 * These rules used to read the run over the text or over a node's text, so an escaped space passed for a run: `never` took it away; `always` cut a real run behind the escape down to its own space where the writer read the text, and reported without writing where the parser held the escape in the word. The escaped character stands behind one to three backslashes, since the run's parity decides whether it is escaped: a space, a tab, two spaces so that a real run follows the escape, a space and a break for the lineness options, and a hexadecimal comma closed by a space, by two, by three, by a break and by nothing; the whitespace closing a hexadecimal escape is a run to both sides, and three spaces reach past the raw a rule writes into, since PostCSS keeps the closing space in a property. The `-after` twins read the same texts with the escape behind the delimiter, and `indentation` reads the run in front of a semicolon through the same writer.
 *
 * A bare break behind the backslashes, alone and with a space, was added because the backslash is the delimiter itself and the character a write puts behind it is read as its escape; the brace, bracket and parenthesis shapes and the rules reading their runs came with it.
 *
 * The descendant shape, a second escaped tab and `selector-descendant-combinator-no-non-space` were added because `postcss-selector-parser` reads a backslash in front of a tab as no escape: the tab stands in the spaces of its nodes, and a rule writing them wrote over a character of the name. The second escaped tab is the shape the parser files an attribute's parts so that it prints them back in another order.
 *
 * A multi-line block closing on the same run was added when the rules of the brace, the bracket and the parenthesis came to read their run over the copy with the escapes masked: the `-multi-line` options speak only of a block the single-line shapes are not. A space in front of the bracket's run came with it, since `postcss-selector-parser` reads what follows as the attribute's flag and files the run in another part of it than the one `selector-attribute-brackets-space-inside` writes.
 *
 * A second break behind the hexadecimal escape was added because the character closing such an escape stands in the run `selector-descendant-combinator-no-non-space` writes: the one break the corpus already held leaves nothing behind the escape, so no fixture carried a combinator the write could take away.
 *
 * An attribute inside the parentheses of a negation behind a space was added because `postcss-selector-parser` hands the attribute that space, and its print opens on it in front of the index the parser gives the attribute: the operator's rules measured the print from that index and passed every such attribute over.
 *
 * A bare carriage return and a form feed with two spaces behind were added when `no-multiple-whitespaces` came to read a bare carriage return as whitespace of the line, as PostCSS does and as it read a form feed already: both are a line break to the grammar, so an odd run of backslashes in front ends on a delimiter, and a space the rule wrote in place of the break would become that backslash's escape.
 *
 * `no-multiple-whitespaces` is here because it reads every run of a value rather than one beside a delimiter, and the texts here put an escape in front of a run in a value already.
 *
 * The five address shapes were added when the escapes standing in the code of a bare address came to be recorded: the walk steps over a `url()`'s parentheses in one, so no rule reading a copy with the escapes masked saw one inside them. The comma shapes put a delimiter behind the escape, where a shorter run is what an `always` option writes into, and no rule reads a comma inside a bare address at all; the selector shapes carry the same addresses through `selectorSearchCopy`; and the quoted shape is the control, an escape inside a string being that string's under either side.
 *
 * The three interpolation shapes were added when the escapes standing in the code of an interpolation's expression came to be recorded: only a parser whose own tokenizer reads a `//` comment reads an interpolation there at all, so the call shape, whose escape the walk meets itself, is the control that parts the two readings. The open shape leaves the expression unclosed, where its reader and the walk behind it both go over the same characters, so a span recorded twice shows up as a mask longer than the text.
 *
 * The controls: `value-list-comma-space-before`, which reads its run over the search copy already, and `declaration-bang-space-before`.
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
	tabThenEscapedTab: `\t\\\t`,
	hexComma: `2c`,
	hexCommaThenSpace: `2c `,
	hexCommaThenTwoSpaces: `2c  `,
	hexCommaThenThreeSpaces: `2c   `,
	hexCommaThenBreak: `2c\n`,
	hexCommaThenTwoBreaks: `2c\n\n`,
	carriageReturnThenSpaces: `\r  `,
	formFeedThenSpaces: `\f  `,
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
		descendant: (text) => `a${text}b { c: d }`,
		combinatorAfter: (text) => `a>${text}b { c: d }`,
		attribute: (text) => `[a${text}=b] { c: d }`,
		attributeAfter: (text) => `[a=${text}b] { c: d }`,
		negatedAttribute: (text) => `a:not( [a${text}=b] ) { c: d }`,
		negatedAttributeAfter: (text) => `a:not( [a=${text}b] ) { c: d }`,
		bracket: (text) => `[a=b${text}] { c: d }`,
		bracketFlag: (text) => `[a=b ${text}] { c: d }`,
		parenthesis: (text) => `a:not(b${text}) { c: d }`,
		openingBrace: (text) => `a${text}{ b: c }`,
		closingBrace: (text) => `a { b: c${text}}`,
		closingBraceBlock: (text) => `a {\n\tb: c${text}}`,
		semicolon: (text) => `a { b: 1${text}; c: d }`,
		lastSemicolon: (text) => `a { b: 1${text}; }`,
		flagSemicolon: (text) => `a { b: 1${text} !important; c: d }`,
		atRuleSemicolon: (text) => `@import "x"${text};`,
		block: (text) => `a {\n\tb: 1${text};\n\tc: d;\n}`,
		address: (text) => `a { b: url(c${text}d); e: f }`,
		addressComma: (text) => `a { b: url(c${text},d); e: f }`,
		quotedAddress: (text) => `a { b: url("c${text}d"); e: f }`,
		selectorAddress: (text) => `:is(url(c${text}d)) { e: f }`,
		selectorAddressComma: (text) => `:is(url(c${text},d)) { e: f }`,
		interpolationAddress: (text) => `a { b: url(c#{d${text}e}f); g: h }`,
		interpolationCall: (text) => `a { b: f(c#{d${text}e}f); g: h }`,
		interpolationOpen: (text) => `a { b: url(c#{d${text}e); f: g }`,
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
	{ rule: `selector-descendant-combinator-no-non-space`, primary: true },
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
	{ rule: `no-multiple-whitespaces`, primary: true },
	{ rule: `value-list-comma-space-before`, primary: `always` },
	{ rule: `declaration-bang-space-before`, primary: `never` },
]

export { configs, corpus, name }
