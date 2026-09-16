/**
 * A call whose parentheses PostCSS's tokenizer holds as one `brackets` token, holding every character code reads as a token of its own, in every place a rule writing inside parentheses reaches.
 *
 * Written for 1789556602: a break written into such a token makes the parentheses code, and a `[` inside, or a `{` in a custom property's value, is then a group nothing closes, so the output stops parsing; no oracle carries a bracket inside parentheses. The contents whose group is closed, or which the parser passes over, are the control set, expected to move nowhere.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the parentheses hold: a square bracket or a brace nothing closes, alone and beside a comma on either side, the same closed, a closing one alone, and the other characters, which open no group. */
const CONTENTS: Record<string, string> = {
	openSquare: `a[b`,
	openSquareThenComma: `a[b,c`,
	commaThenOpenSquare: `a,[b`,
	openBrace: `a{b`,
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

/** Where the call stands: a value, an ordinary and a custom property's, glued behind a sign as an address is, nested in another call, in front of a bang, and in an at-rule's params and a selector, which no rule here writes into but the control of the places. */
const PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: 1 f(${call}) 2px; c: "d" }\n`,
	customProperty: (call) => `a { --b: f(${call}); c: "d" }\n`,
	gluedAddress: (call) => `a { b: 1+url(${call}) 2px; c: "d" }\n`,
	nested: (call) => `a { b: f(1, f(${call})) 2px; c: "d" }\n`,
	beforeBang: (call) => `a { b: f(${call}) !important; c: "d" }\n`,
	mediaFeature: (call) => `@media (a: f(${call})) { b { c: "d" } }\n`,
	selector: (call) => `a:is(${call}) { c: "d" }\n`,
}

const name: Sweep[`name`] = `brackets-token`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), content: keysOf(CONTENTS) }, ({ place, content }) => {
	let wrap = PLACES[place ?? ``]
	let held = CONTENTS[content ?? ``]

	if (!wrap || held === undefined) throw new Error(`Every axis names a value`)

	return wrap(held)
})

/** The three rules writing a break inside a call's parentheses, and the space twins and the comma space rules as the control, which write no break. */
const configs: Sweep[`configs`] = ([
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`function-comma-space-before`, [`always`, `never`]],
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
