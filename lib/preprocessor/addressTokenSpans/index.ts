import { Input } from "postcss"
import postcssTokenize, { type Tokenizer } from "postcss/lib/tokenize"

import type { AddressSpan } from "../../utils/findCommentSpans/index.ts"
import { syntaxTokenizesInlineComments } from "../readsInlineComments/index.ts"
import { scssTokenize } from "../scssTokenize/index.ts"

/** A quotation mark, which only an address's parentheses carry inside a `brackets` token. */
const QUOTATION_MARK = /['"]/u

/**
 * Reads a tokenizer out, token by token.
 * @param tokenizer - At the opening of the text.
 * @returns Every token it read.
 */
function tokensOf (tokenizer: Tokenizer): [string, string, number?][] {
	let tokens: [string, string, number?][] = []

	while (!tokenizer.endOfFile()) tokens.push(tokenizer.nextToken({ ignoreUnclosed: true }))

	return tokens
}

/**
 * Reads a text with the tokenizer the syntax's parser reads by: `postcss-scss`'s for SCSS, PostCSS's for CSS and Less. `postcss-scss` throws over an open string or interpolation, which is a text its parser refuses as well, and PostCSS's answers for that one; where the optional package cannot be reached nothing answers, since PostCSS's tokenizer opens no token behind whitespace of the parenthesis and closes one at the first `)` where that one counts parentheses.
 * @param text - The text read.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The tokens, or nothing where the parser's own tokenizer is out of reach.
 */
function tokensRead (text: string, syntax?: unknown, from?: string): [string, string, number?][] | undefined {
	if (syntaxTokenizesInlineComments(syntax)) {
		let tokenize = scssTokenize(from)

		if (!tokenize) return undefined

		try {
			return tokensOf(tokenize(new Input(text), { ignoreErrors: true }))
		}
		catch {
			// PostCSS's tokenizer answers instead
		}
	}

	return tokensOf(postcssTokenize(new Input(text), { ignoreErrors: true }))
}

/**
 * Finds the parentheses the syntax's tokenizer takes as one token behind the word `url`, whose quotation marks are characters of an address and no strings.
 *
 * The tokenizer keeps a stack of the words it reads and pops one at each `(`; the parentheses open a token where the word popped there is `url` itself. Whitespace and a comment push no word, so `url (`, `url\t(`, `url\n(` and `url/*c*\/(` open one as `url(` does, and so does a property named `url` in front of a value opening on a `(`. `postcss-value-parser` opens its own address mode behind a lowercase `url` glued to the `(` alone, and reads a quotation mark in every other spelling as a string; closing such a string leaves a text the parser refuses (1789653630).
 *
 * Only a token holding a quotation mark is returned, which is the only one this answers for: both tokenizers give a plain pair of parentheses up as `brackets` the moment its content holds a mark, so a `brackets` token carrying one can only be an address's.
 *
 * The text in front is read for the tokenizer's state, which a word of its own carries into the text asked about, and no span is answered for it; a token opening there and reaching into the text is cut at the text's start. A text holding no parenthesis holds no such token and is answered without a tokenizer at all.
 * @param before - Read but not answered for: the property and what stands between it and the value, or the at-rule's name and what stands behind it.
 * @param text - The value or params the spans are sought in, standing right behind `before`.
 * @param [syntax] - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The spans, in the text's coordinates, in source order, or nothing where the text may hold such a token and the parser's own tokenizer is out of reach.
 */
export function addressTokenSpans (before: string, text: string, syntax?: unknown, from?: string): AddressSpan[] | undefined {
	let read = `${before}${text}`

	if (!QUOTATION_MARK.test(text) || !read.includes(`(`)) return []

	let tokens = tokensRead(read, syntax, from)

	if (!tokens) return undefined

	let spans: AddressSpan[] = []

	for (let [name, content, openIndex] of tokens) {
		if (name !== `brackets` || openIndex === undefined || !QUOTATION_MARK.test(content)) continue

		let start = openIndex - before.length
		let end = start + content.length

		if (end > 0) spans.push({ start: Math.max(start, 0), end })
	}

	return spans
}
