/**
 * A call whose parentheses PostCSS's tokenizer holds as one `brackets` token, holding every character code reads as a token of its own, in every place a rule writing inside parentheses reaches.
 *
 * Written for 1789556602: a break written into such a token makes the parentheses code, and a `[` inside, or a `{` in a custom property's value, is then a group nothing closes, so the output stops parsing; no oracle carries a bracket inside parentheses. The contents whose group is closed, or which the parser passes over, are the control set, expected to move nowhere. The places without a name in front of the parentheses, where the comma is a value list's and not a call's, were added for 1789637408, with a multi-line list among them since the list's lineness is read over the whole declaration. The parentheses of a media feature, where the comma is a media query list's and a `{` opens a group whatever the at-rule, were added for 1789637409 with the brace contents beside a comma, and a multi-line list among them likewise.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the parentheses hold: a square bracket or a brace nothing closes, alone and beside a comma on either side, the same closed, a closing one alone, and the other characters, which open no group. */
const CONTENTS: Record<string, string> = {
	openSquare: `a[b`,
	openSquareThenComma: `a[b,c`,
	commaThenOpenSquare: `a,[b`,
	openBrace: `a{b`,
	openBraceThenComma: `a{b,c`,
	commaThenOpenBrace: `a,{b`,
	openBraceThenSemicolon: `a{b;c`,
	closedSquare: `a[b]`,
	closedBrace: `a{b}`,
	closingSquare: `a]b`,
	closingBrace: `a}b`,
	semicolon: `a;b`,
	colon: `a:b`,
	bang: `a!b`,
	comma: `a,b`,
	atWord: `a@b`,
	hash: `a#b`,
	space: `a b`,
}

/** Where the call stands: a value, an ordinary and a custom property's, glued behind a sign as an address is, nested in another call, in front of a bang, and in an at-rule's params and a selector, which no rule here writes into but the control of the places; then the same parentheses without a name, in a value, a custom property's, glued behind a sign, in front of a bang, and in a value list made multi-line by a break outside them; then the same as a media feature, in a media query list of one line and of two. */
const PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: 1 f(${call}) 2px; c: "d" }\n`,
	customProperty: (call) => `a { --b: f(${call}); c: "d" }\n`,
	gluedAddress: (call) => `a { b: 1+url(${call}) 2px; c: "d" }\n`,
	nested: (call) => `a { b: f(1, f(${call})) 2px; c: "d" }\n`,
	beforeBang: (call) => `a { b: f(${call}) !important; c: "d" }\n`,
	mediaFeature: (call) => `@media (a: f(${call})) { b { c: "d" } }\n`,
	selector: (call) => `a:is(${call}) { c: "d" }\n`,
	namelessValue: (held) => `a { b: 1 (${held}) 2px; c: "d" }\n`,
	namelessCustomProperty: (held) => `a { --b: (${held}); c: "d" }\n`,
	namelessGluedSign: (held) => `a { b: 1+(${held}) 2px; c: "d" }\n`,
	namelessBeforeBang: (held) => `a { b: (${held}) !important; c: "d" }\n`,
	namelessMultiLineList: (held) => `a { b: 1 (${held}) 2px,\n3px; c: "d" }\n`,
	mediaQuery: (held) => `@media a (${held}) { b { c: "d" } }\n`,
	mediaMultiLineList: (held) => `@media a (${held}),\nb { b { c: "d" } }\n`,
}

const name: Sweep[`name`] = `brackets-token`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), content: keysOf(CONTENTS) }, ({ place, content }) => {
	let wrap = PLACES[place ?? ``]
	let held = CONTENTS[content ?? ``]

	if (!wrap || held === undefined) throw new Error(`Every axis names a value`)

	return wrap(held)
})

/** The three rules writing a break inside a call's parentheses and the two pairs writing one beside a value list's or a media query list's comma, and the space twins and the comma space rules as the control, which write no break. */
const configs: Sweep[`configs`] = ([
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`function-comma-space-before`, [`always`, `never`]],
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`]],
	[`media-query-list-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`media-query-list-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`media-query-list-comma-space-after`, [`always`, `never`]],
	[`media-query-list-comma-space-before`, [`always`, `never`]],
	[`value-list-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`value-list-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
