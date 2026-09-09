/**
 * A `url()` in a text, under every spelling of its name, of what stands in front of it, and of what its parentheses hold.
 *
 * Written for [#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427) and [#398](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398), when `max-line-length` and `endsWithInlineComment` were made to read a `url()` as `findCommentSpans` does; no oracle has an escaped name, one behind a non-ASCII code point or an interpolation, or one inside a comment or a string.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The spellings CSS reads as `url`, the runs that make an ordinary call, a name behind each thing that closes a scan state, and a backslash-newline delimiter in front of and inside the name ([#566](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566)). */
const NAMES: Record<string, string> = {
	plain: `url`,
	upper: `URL`,
	escapedLetter: `u\\rl`,
	hexEscapedLetter: `\\75 rl`,
	escapedName: `\\url`,
	asciiWordInFront: `aurl`,
	nonAsciiInFront: `éurl`,
	hyphenInFront: `image-url`,
	lessInterpolationInFront: `@{p}url`,
	scssInterpolationInFront: `#{$p}url`,
	hexEscapeInFront: `\\61 url`,
	behindString: `"x"url`,
	behindBlockComment: `/*c*/url`,
	behindInlineComment: `//c\nurl`,
	behindAddress: `url(x)url`,
	backslashThenLineFeedInFront: `\\\nurl`,
	backslashThenWindowsPairInFront: `\\\r\nurl`,
	backslashThenCarriageReturnInFront: `\\\rurl`,
	backslashThenFormFeedInFront: `\\\furl`,
	backslashThenFormFeedInside: `u\\\frl`,
}

/** Bare, quoted, and either behind whitespace, each with characters a reader may misread; the two spellings a quotation mark and a parenthesis behind whitespace make are the divergence [#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557) closed. */
const ADDRESSES: Record<string, string> = {
	bareProtocol: `http://a/b.png`,
	bareSlashStar: `a/*b.png`,
	bareParenthesis: `a(b)c.png`,
	bareQuote: `a"b.png`,
	bareOneCharacter: `a`,
	quotedProtocol: `"http://a/b.png"`,
	quotedThenSlashes: `"a" // c`,
	quotedThenSlashesBroken: `"a" // c\n`,
	spacedQuotedThenSlashes: ` "a" // c `,
	spacedQuotedThenSlashesBroken: ` "a" // c\n`,
	quotedThenBlockComment: `"a" /* c */`,
	spacedQuotedThenBlockComment: ` "a" /* c */ `,
	spacedBareParenthesis: ` a(b)c.png `,
	quotedThenArgument: `"a", format("woff2")`,
	spacedBareProtocol: ` http://a/b.png `,
	spacedQuotedProtocol: ` "http://a/b.png" `,
	empty: ``,
}

/** Where the text stands; two of the places are no code. */
const PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: ${call} 1px; c: 2px }\n`,
	blockTail: (call) => `a { b: 1px ${call} }\n`,
	list: (call) => `a { b: 1px , ${call} , 2px; }\n`,
	atRule: (call) => `@import ${call} screen;\na { b: 1px; }\n`,
	media: (call) => `@media ( min-width: 1px ) and ( c: ${call} ) { a { b: 1px; } }\n`,
	comment: (call) => `/* ${call} */\na { b: 1px; }\n`,
	string: (call) => `a { b: "${call}" 1px; }\n`,
}

const name: Sweep[`name`] = `address-in-a-text`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), name: NAMES, address: ADDRESSES }, ({ place, name: spelledName, address }) => {
	let wrap = PLACES[place ?? ``]

	if (!wrap || spelledName === undefined || address === undefined) throw new Error(`Every axis names a value`)

	return wrap(`${spelledName}(${address})`)
})

/** Every rule reading the inline-comment guard, the four writers reading the comment spans that move over these forms, and `max-line-length` at a maximum on either side of these lines' width. */
const configs: Sweep[`configs`] = ([
	[`block-closing-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-closing-brace-space-before`, [`always`, `never`]],
	[`block-opening-brace-newline-after`, [`always`, `never-multi-line`]],
	[`block-opening-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-opening-brace-space-before`, [`always`, `never`]],
	[`declaration-bang-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-after`, [`always`, `never-multi-line`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`]],
	[`declaration-block-trailing-semicolon`, [`always`, `never`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`function-comma-space-before`, [`always`, `never`]],
	[`function-parentheses-newline-inside`, [`always`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`]],
	[`function-whitespace-after`, [`always`, `never`]],
	[`indentation`, [`tab`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`media-query-list-comma-space-before`, [`always`, `never`]],
	[`unit-case`, [`lower`, `upper`]],
	[`value-list-comma-newline-after`, [`always`, `never-multi-line`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
	[`max-line-length`, [20, 40]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
