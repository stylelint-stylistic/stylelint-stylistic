/**
 * A `url()` in a text, under every spelling of its name, of what stands in front of it, and of what its parentheses hold.
 *
 * Written for [#427](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/427) and [#398](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/398), when `max-line-length` and `endsWithInlineComment` were made to read a `url()` as `findCommentSpans` does; no oracle has an escaped name, one behind a non-ASCII code point or an interpolation, or one inside a comment or a string.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The spellings CSS reads as `url`, the runs that make an ordinary call, a name behind each thing that closes a scan state, a backslash-newline delimiter in front of and inside the name ([#566](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566)), the three signs the tokenizer glues the name to where `postcss-value-parser` parts it, which left the parentheses an address to the parser alone, a bang glued to the name and parted from it by a space, where a write behind the bang switches how the tokenizer reads the parentheses, and a word ending in a digit behind an escaped backslash, which opens no escape to weld the name onto ([#579](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/579)), beside the one backslash that does. */
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
	behindComma: `1,url`,
	behindSolidus: `1/url`,
	behindBang: `1!url`,
	behindBangAndSpace: `1! url`,
	behindVerticalTab: `1\vurl`,
	behindString: `"x"url`,
	behindBlockComment: `/*c*/url`,
	behindInlineComment: `//c\nurl`,
	behindAddress: `url(x)url`,
	backslashThenLineFeedInFront: `\\\nurl`,
	backslashThenWindowsPairInFront: `\\\r\nurl`,
	backslashThenCarriageReturnInFront: `\\\rurl`,
	backslashThenFormFeedInFront: `\\\furl`,
	backslashThenFormFeedInside: `u\\\frl`,
	escapedBackslashAndDigitInFront: `x\\\\9 url`,
	escapedBackslashAndDigitThenHexEscapedLetter: `x\\\\9 \\75 rl`,
	hexEscapeAndSpaceInFront: `x\\9 url`,
}

/** Bare, quoted, and either behind whitespace, each with characters a reader may misread; the two spellings a quotation mark and a parenthesis behind whitespace make are the divergence [#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557) closed, the three block comments behind whitespace the one [#660](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/660) closed, and the three comments holding a parenthesis in parentheses Sass reads as code the one [#661](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/661) closed, the two interpolations holding a call the reading of an address past the call's parenthesis, and the interpolation holding a comment with a quotation mark and a parenthesis what that reading has to keep of it; a parenthesis nothing closes, bare and inside a string, is what parts the writes [#533](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/533) refused from the writes it kept; `bareSlashStar` and `bareBlockComment` are their control, the same delimiters with no whitespace in front of them, except under `postcss-scss`, where Sass reads `bareBlockComment`'s parentheses as code; the two strings holding the opening delimiter of a comment are what a string hides inside parentheses whose comments are read, the spaced one under every syntax and the other under `postcss-scss`; the two strings holding a parenthesis behind whitespace are where `postcss-value-parser` closed the call inside the string, `bareStringHoldingParenthesis` their control; `bareDimensionColourFraction` holds what the case, zero and colour rules write where they read no address; the escaped double slash behind a pair of parentheses stands where `postcss-scss` still holds one url token and Sass reads the escape, which the walk read as a comment, and the one behind a string is its control, which the walk goes on reading as one since a fix taking the whitespace in front of the string away turns it into a comment. */
const ADDRESSES: Record<string, string> = {
	bareProtocol: `http://a/b.png`,
	bareSlashStar: `a/*b.png`,
	bareBlockComment: `a /* c */ `,
	bareParenthesis: `a(b)c.png`,
	bareQuote: `a"b.png`,
	bareOpenParenthesis: `a(b.png`,
	quotedOpenParenthesis: `"a(b.png"`,
	bareOneCharacter: `a`,
	bareDimensionColourFraction: `1.0PX,#FFF,.5`,
	quotedProtocol: `"http://a/b.png"`,
	quotedThenSlashes: `"a" // c`,
	quotedThenSlashesBroken: `"a" // c\n`,
	spacedQuotedThenSlashes: ` "a" // c `,
	spacedQuotedThenSlashesBroken: ` "a" // c\n`,
	quotedThenBlockComment: `"a" /* c */`,
	spacedQuotedThenBlockComment: ` "a" /* c */ `,
	spacedBareParenthesis: ` a(b)c.png `,
	spacedBareBlockComment: ` a /* c */ `,
	spacedBareEscapedBlockComment: ` a\\/* c */ `,
	spacedBareEscapedSlashes: ` a\\// c `,
	spacedParenthesisThenEscapedSlashes: ` a(b) \\// c `,
	spacedQuotedThenEscapedSlashes: ` "a" \\// c `,
	spacedBareBlockCommentHoldingParenthesis: ` a /* ) */ `,
	spacedBareBlockCommentFirst: ` /* c */ a.png `,
	quotedThenArgument: `"a", format("woff2")`,
	bareBlockCommentHoldingParenthesis: `a /* ) / b */ `,
	bareInlineCommentHoldingParenthesis: `a // ) , b\n`,
	variableThenBlockComment: `$a /* ) */`,
	interpolatedCallThenProtocol: `#{f(a)}//c/a.png`,
	variableThenInterpolatedCallThenSlashes: `$a #{f(b)} // c\n`,
	variableThenInterpolationHoldingComment: `$a #{c // it's )\n}`,
	spacedBareStringHoldingParenthesis: ` a ") / b , .5 1.0 #FFF 1PX f( 1 )" `,
	spacedBareStringHoldingParenthesisThenComment: ` a ")" /* ) */ b `,
	bareStringHoldingParenthesis: `a ") / b , .5 1.0 #FFF 1PX f( 1 )" `,
	spacedStringHoldingSlashStar: ` a "/*" b/c `,
	stringHoldingSlashStarThenSlashes: `a "/*" // c\n`,
	spacedBareProtocol: ` http://a/b.png `,
	spacedQuotedProtocol: ` "http://a/b.png" `,
	empty: ``,
}

/** Where the text stands; two of the places are no code. */
const PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: ${call} 1px; c: 2px }\n`,
	blockTail: (call) => `a { b: 1px ${call} }\n`,
	list: (call) => `a { b: 1px , ${call} , 2px; }\n`,
	grid: (call) => `a { grid-template-areas: "a b" ${call} "c d"; }\n`,
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

/** Every rule reading the inline-comment guard, the four writers reading the comment spans that move over these forms, the bang writer behind which a run switches the reading of the parentheses, the value-parser readers that wrote into a string holding a parenthesis, and `max-line-length` at a maximum on either side of these lines' width. */
const configs: Sweep[`configs`] = ([
	[`block-closing-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-closing-brace-space-before`, [`always`, `never`]],
	[`block-opening-brace-newline-after`, [`always`, `never-multi-line`]],
	[`block-opening-brace-newline-before`, [`always`, `never-multi-line`]],
	[`block-opening-brace-space-before`, [`always`, `never`]],
	[`color-hex-case`, [`lower`, `upper`]],
	[`declaration-bang-space-after`, [`always`, `never`]],
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
	[`named-grid-areas-alignment`, [true]],
	[`media-query-list-comma-space-before`, [`always`, `never`]],
	[`number-leading-zero`, [`always`, `never`]],
	[`number-no-trailing-zeros`, [true]],
	[`string-quotes`, [`single`, `double`]],
	[`unit-case`, [`lower`, `upper`]],
	[`value-list-comma-newline-after`, [`always`, `never-multi-line`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
	[`value-slash-space-after`, [`always`, `never`]],
	[`value-slash-space-before`, [`always`, `never`]],
	[`max-line-length`, [20, 40]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
