/**
 * A bang inside the parentheses of a `url()`, beside a flag behind the call or none, under the spellings of the name `findAddressSpans` reads as an address and two it does not.
 *
 * Written when `declaration-bang-space-*` stopped reading a bang inside a bare address as a flag; `address-in-a-text` holds no bang inside the parentheses, and no oracle does either.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Spellings read as `url`, and calls whose parentheses are code. */
const NAMES: Record<string, string> = {
	plain: `url`,
	upper: `URL`,
	escapedLetter: `u\\rl`,
	hexEscapedLetter: `\\75 rl`,
	hyphenInFront: `image-url`,
	other: `c`,
}

/** A bang with every run beside it, bare and quoted, behind whitespace inside the parentheses, beside a comment, and behind a break the address does not hold. */
const ADDRESSES: Record<string, string> = {
	abutting: `x!y`,
	spaceInFront: `x !y`,
	spaceBehind: `x! y`,
	spacesAround: `x ! y`,
	flagInside: `x !important`,
	spaced: ` x!y `,
	behindComment: ` /* c */ x!y `,
	commentHoldingBang: ` x /* !c */ `,
	quoted: `"x!y"`,
	quotedThenBang: `"x" !y`,
	lineBreakInFront: `x\n!y`,
	trailingBang: `x!`,
	leadingBang: `!x`,
}

/** Where the call stands, and what follows it. */
const PLACES: Record<string, (call: string) => string> = {
	flag: (call) => `a { b: ${call} !important; }\n`,
	abuttingFlag: (call) => `a { b: ${call}!important; }\n`,
	noFlag: (call) => `a { b: ${call}; c: d }\n`,
	list: (call) => `a { b: 1px, ${call} ! important }\n`,
	sassDefault: (call) => `$b: ${call} !default;\n`,
}

const name: Sweep[`name`] = `bang-in-address`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), name: NAMES, address: ADDRESSES }, ({ place, name: spelledName, address }) => {
	let wrap = PLACES[place ?? ``]

	if (!wrap || spelledName === undefined || address === undefined) throw new Error(`Every axis names a value`)

	return wrap(`${spelledName}(${address})`)
})

/** The two rules the checker serves, under every option. */
const configs: Sweep[`configs`] = ([
	[`declaration-bang-space-after`, [`always`, `never`]],
	[`declaration-bang-space-before`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
