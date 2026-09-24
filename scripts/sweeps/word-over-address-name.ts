/**
 * A word standing between the name of a bare address and its parentheses, with parentheses of its own that pop it off the tokenizer's stack, in the places the rules below write in front of the name at.
 *
 * The tokenizer pushes every word it reads and pops one at each `(`, so a word popped by parentheses of its own is gone from the next `(`, which then pops the name and opens a url token there. A rule parting the name from the sign in front of it switches that reading, and where the parentheses hold a string covering their `)` the output stops parsing. The middles holding no word, and the ones whose word no parentheses pop, are the control set, expected to move nowhere; `plainAddress` is the content whose two readings agree, expected to keep its fix. `selector-list-comma-space-after` and `-newline-after` ask the utility as well and are left out: a bare address in a selector list reaches no fix under any of these places.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What stands between the name and its parentheses: nothing and a word no parentheses pop, then words popped by parentheses of their own, then the tokens that push no word followed by parentheses that therefore pop the name itself. */
const MIDDLES: Record<string, string> = {
	nothing: ``,
	wordAlone: ` x`,
	wordThenParentheses: ` x(y)`,
	twoWordsThenParentheses: ` x y(z)(w)`,
	wordThenTwoParentheses: ` x(y)(z)`,
	nameThenParentheses: ` url(y)`,
	squareBracketWordThenParentheses: `[x](y)`,
	escapeThenParentheses: `\\,(x)`,
	stringThenParentheses: `"s"(x)`,
	atWordThenParentheses: `@a(x)`,
	commaThenParentheses: `,(x)`,
	interpolationThenParentheses: `#{a}(x)`,
	commentThenParentheses: ` x/*c*/(y)`,
}

/** What the parentheses of the address hold: a string covering their `)`, a quotation mark nothing closes, a group of either kind, and an address whose two readings agree. */
const HELD: Record<string, string> = {
	stringOverCloser: `a ")" b`,
	openQuote: `a"b`,
	openParenthesis: `a(b`,
	openSquare: `a[b`,
	plainAddress: `a/b.png`,
}

/** Where the address stands, each place glueing the name to the sign a rule writes behind: a value behind a solidus, a comma and a bang, a call's argument, a media query list, and a media feature's range operator and solidus. */
const PLACES: Record<string, (address: string) => string> = {
	valueSlash: (address) => `a { b: 1/${address} 2px; c: "d" }\n`,
	valueComma: (address) => `a { b: 1,${address} 2px; c: "d" }\n`,
	declarationBang: (address) => `a { b: 1!${address} 2px; c: "d" }\n`,
	call: (address) => `a { b: f(1,${address}) 2px; c: "d" }\n`,
	mediaQuery: (address) => `@media a,${address} { b { c: "d" } }\n`,
	mediaFeature: (address) => `@media (a>=${address}) { b { c: "d" } }\n`,
	mediaFeatureSlash: (address) => `@media (a:1/${address}) { b { c: "d" } }\n`,
}

const name: Sweep[`name`] = `word-over-address-name`

const corpus: Sweep[`corpus`] = multiply({ held: keysOf(HELD), middle: keysOf(MIDDLES), place: keysOf(PLACES) }, ({ held, middle, place }) => {
	let wrap = PLACES[place ?? ``]
	let between = MIDDLES[middle ?? ``]
	let inside = HELD[held ?? ``]

	if (!wrap || between === undefined || inside === undefined) throw new Error(`Every axis names a value`)

	return wrap(`url${between}(${inside})`)
})

/** The thirteen rules asking `rereadsAnAddress` that reach these places, each writing the run in front of the name, with the two writing behind the sign's other side as the control. */
const configs: Sweep[`configs`] = ([
	[`declaration-bang-space-after`, [`always`, `never`]],
	[`declaration-bang-space-before`, [`always`, `never`]],
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`media-feature-range-operator-space-after`, [`always`, `never`]],
	[`media-feature-slash-space-after`, [`always`, `never`]],
	[`media-query-list-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`media-query-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-slash-newline-after`, [`always`, `never-multi-line`]],
	[`value-slash-space-after`, [`always`, `never`]],
	[`value-slash-space-before`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
