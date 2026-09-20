/**
 * The word a node leaves on the tokenizer's stack for the `(` of the node behind it, over what those parentheses hold.
 *
 * Written for 1789910265: the stack runs through the whole file and an at-rule's name pushes no word, so a `(` of its params pops what a node in front left there and holds the parentheses an address's token. `string-quotes` read the spans from the node's own start alone, saw no token and rewrote both marks of a pair the tokenizer pairs across the token's edge, and the stylesheet stopped parsing. The texts in front that leave no `url` on the stack are the control set, expected to move nowhere, and so are the writers of an at-rule's parentheses, which read no span of an address.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands in front of the node: the texts leaving `url` on top of the stack — a value, a value closed by a semicolon, an at-rule's params, the same leaving two of them, a nested rule's value, and a comment only one tokenizer reads — then the controls, which leave something else there or nothing at all. */
const FRONTS: Record<string, string> = {
	nothing: ``,
	declarationValue: `a { b: url }`,
	declarationSemicolon: `a { b: url; }`,
	atRuleParams: `@x url;`,
	atRuleTwoWords: `@x url url;`,
	nestedValue: `a { b { c: url } }`,
	inlineComment: `// url\n`,
	inlineCommentBehindValue: `a { b: url // c\n }`,
	blockComment: `/* url */`,
	blockCommentBehindValue: `a { b: url /* c */ }`,
	string: `a { b: "url" }`,
	address: `a { b: url(x) }`,
	call: `a { b: f(url) }`,
	upperName: `a { b: URL }`,
	wordBehindName: `a { b: url x }`,
	selectorAttribute: `a[b=url] { c: d }`,
}

/** The node the stack reaches: an at-rule whose params open on a `(`, the parentheses holding a pair parted by their own closer, a pair inside them, a mark nothing closes, two groups of their own, a feature with a colon, and a rule whose value opens on a `(`; then the two nodes whose second `(` pops what the first one left, an at-rule's params and a value behind a property named `url`. */
const NODES: Record<string, string> = {
	pairOverCloser: `@media (c "d) "e" { f: g }`,
	pairInside: `@media (c"d"e) { f: g }`,
	openMark: `@media (c "d) { e: f }`,
	twoGroups: `@media ("a") ("b") { c { d: e } }`,
	featureColon: `@supports (c: "d") { e { f: g } }`,
	quotedAddress: `@import url("a") screen;`,
	spacedAddress: `@import url ("a") screen;`,
	valueParentheses: `c { d: (e "f"g); }`,
	twoPairsOverClosers: `@media (c "d) (e "f) "g" { h: i }`,
	propertyThenTwoGroups: `url { url: (d "e) (f "g) "h" }`,
}

const name: Sweep[`name`] = `word-carried-into-a-node`

const corpus: Sweep[`corpus`] = multiply({ front: keysOf(FRONTS), node: keysOf(NODES) }, ({ front, node }) => {
	let text = FRONTS[front ?? ``]
	let held = NODES[node ?? ``]

	if (text === undefined || held === undefined) throw new Error(`Every axis names a value`)

	return `${text}${text && !text.endsWith(`\n`) ? ` ` : ``}${held}\n`
})

/** The rule reading the spans of such a token, and the writers of an at-rule's parentheses, its colon and its query list as the control, which read no span and are expected to move nowhere. */
const configs: Sweep[`configs`] = ([
	[`string-quotes`, [`single`, `double`]],
	[`media-feature-colon-space-after`, [`always`, `never`]],
	[`media-feature-colon-space-before`, [`always`, `never`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`media-query-list-comma-space-after`, [`always`, `never`]],
	[`at-rule-name-space-after`, [`always`, `always-single-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
