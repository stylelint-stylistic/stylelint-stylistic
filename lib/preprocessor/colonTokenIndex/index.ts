import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

import { Input } from "postcss"
import postcssTokenize, { type Tokenizer } from "postcss/lib/tokenize"
import type scssTokenizeModule from "postcss-scss/lib/scss-tokenize"

import { syntaxTokenizesInlineComments } from "../readsInlineComments/index.ts"

/** The `postcss-scss` tokenizer per place; `null` where the place has none. */
let scssTokenizers: Map<string, typeof scssTokenizeModule | null> = new Map()

/**
 * Loads `postcss-scss`'s tokenizer, an optional package, from the stylesheet's directory first and the plugin's second.
 * @param from - The stylesheet's file.
 * @returns The tokenizer, or nothing.
 */
function scssTokenizer (from?: string): typeof scssTokenizeModule | undefined {
	for (let place of from === undefined ? [import.meta.url] : [pathToFileURL(from).href, import.meta.url]) {
		let known = scssTokenizers.get(place)

		if (known === undefined) {
			try {
				known = createRequire(place)(`postcss-scss/lib/scss-tokenize`) as typeof scssTokenizeModule
			}
			catch {
				known = null
			}

			scssTokenizers.set(place, known)
		}

		if (known) return known
	}

	return undefined
}

/**
 * Reads a tokenizer to the first colon token at or behind a position.
 * @param tokenizer - At the opening of the text.
 * @param start - Where counting starts.
 * @returns The colon's index from `start`, or `-1`.
 */
function colonIndexPast (tokenizer: Tokenizer, start: number): number {
	while (!tokenizer.endOfFile()) {
		let [name, , openIndex] = tokenizer.nextToken({ ignoreUnclosed: true })

		// A colon carries an index; a whitespace run does not
		if (name === `:` && openIndex !== undefined && openIndex >= start) return openIndex - start
	}

	return -1
}

/**
 * Finds the first character of a text the syntax's parser reads as a colon token.
 *
 * A colon inside a comment, a string, a group, an at-word or an escape opens no declaration, so the text goes to the tokenizer the parser reads with: PostCSS's for CSS and Less, `postcss-scss`'s for SCSS. `postcss-scss` throws over an open string or interpolation, and PostCSS's then answers; where the package is missing the answer is no colon, since PostCSS's takes a `//` comment for code. `before` is read first for the tokenizer's state.
 * @param before - Read but not answered for.
 * @param text - The text the colon is sought in, standing right behind `before`.
 * @param syntax - The syntax, as `nodeSyntax` gives it.
 * @param [from] - The stylesheet's file.
 * @returns The index of the first colon token, or `-1`.
 */
export function colonTokenIndex (before: string, text: string, syntax?: unknown, from?: string): number {
	let read = `${before}${text}`

	// Only `postcss-scss`'s tokenizer reads a `//` comment
	if (syntaxTokenizesInlineComments(syntax)) {
		let tokenize = scssTokenizer(from)

		if (!tokenize) return -1

		try {
			return colonIndexPast(tokenize(new Input(read), { ignoreErrors: true }), before.length)
		}
		catch {
			// PostCSS's tokenizer answers instead
		}
	}

	let colonIndex = colonIndexPast(postcssTokenize(new Input(read), { ignoreErrors: true }), before.length)

	// Where `before` opens a comment over the whole text the parser ended the property at a colon of its own, so the text is read alone
	if (colonIndex === -1 && before !== ``) return colonIndexPast(postcssTokenize(new Input(text), { ignoreErrors: true }), 0)

	return colonIndex
}
