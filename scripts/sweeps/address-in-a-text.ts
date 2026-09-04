/**
 * An address written in a text, under every spelling of its name, of what stands in front of that name, and of what its parentheses hold.
 *
 * Written for #427 and #398. Three places used to look for a `url()` in a text and each read a different thing: the walk behind `findCommentSpans` read the name as CSS spells it and told a token from a call by what stood in front of the parenthesis, `max-line-length` matched a pattern that asked neither question, and `endsWithInlineComment` asked a second pattern of its own whose reading of a name was the ASCII word characters and the hyphen. Both places ask the walk now, and this corpus is the one that says what moved with them: no oracle carries an address whose name is spelled with an escape, whose name is preceded by a code point outside ASCII or by an interpolation, or which stands inside a comment or a string.
 *
 * The axes are the three questions the reading turns on and the one that decides whether the answer reaches a rule at all. The name is spelled in the five ways CSS spells `url` — plainly, in upper case, with a letter escaped, with a letter written as a hexadecimal escape, and with the whole name escaped — and in ten that spell something else, where a word, a code point outside ASCII, a hyphen, an interpolation of either preprocessor, a hexadecimal escape, a string, a block comment, an end-of-line comment or an address of its own stands in front of those three letters. The parentheses open on a bare address, on a quoted one, or on whitespace and then either, which is what tells the `url()` token from the `url()` function; and what they hold carries the characters a reader may take for something else — the double slash of a protocol, the delimiters of a comment of either kind, a parenthesis of its own, a quotation mark, a second argument. The spacing axis is crossed with the comment axis rather than laid beside it: whether whitespace parts the parenthesis from the quotation mark is what tells the token from the function to some readers, so a corpus that carries the comment on one spelling alone is blind to the other. A comment opened by a double slash stands both on the line of the address, where it carries the closing parenthesis off, and broken from it, where it does not: those are two different files to Sass, and a corpus carrying only the first is blind to the one Sass compiles. A name is put behind each of the four things that close a state as well, since a reader that follows a name forward has to begin it again wherever one of those ends, and a name abutting a closing quotation mark reads as a name holding it. The place is where the text stands, since a rule reaches the raw of one node and not of another: a value with a run behind it, a value closing a block, a comma-separated list, an at-rule's parameters, a media query, and the two texts that hold an address and are no code at all, a comment and a string.
 *
 * The configurations are every rule that reads the guard — through `endsWithInlineComment` itself, through `movesEndIntoInlineComment` or through `writesIntoInlineComment` — and `max-line-length`, whose two maxima stand on either side of the width of the corpus's lines.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** How the three letters of the name are spelled, and what stands in front of them: the five spellings CSS reads as `url`, the six runs that leave an ordinary call whose arguments are code, and the four things that close a state a scan may be in — a quotation mark, the delimiter of a block comment, the break of an end-of-line one, and the parenthesis an earlier address closes on — which are no name and which a reader keeping a name's start has to say so about. */
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
}

/** What the parentheses hold: a bare address, a quoted one, and either behind whitespace, which is what tells the token from the function — each carrying the characters a reader may take for something other than an address, and the quoted one carrying what only the function's arguments can hold. */
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
	quotedThenArgument: `"a", format("woff2")`,
	spacedBareProtocol: ` http://a/b.png `,
	spacedQuotedProtocol: ` "http://a/b.png" `,
	empty: ``,
}

/** Where the text stands, since a rule reaches the raw of one node and not of another — and two of the places are no code at all. */
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

/** Every rule that reads the guard over an inline comment, and `max-line-length` under a maximum on either side of the width of these lines. */
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
	[`indentation`, [`tab`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`media-query-list-comma-space-before`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
	[`max-line-length`, [20, 40]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
