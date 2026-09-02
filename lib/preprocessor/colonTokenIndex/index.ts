import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"

import { Input } from "postcss"
import postcssTokenize, { type Tokenizer } from "postcss/lib/tokenize"
import type scssTokenizeModule from "postcss-scss/lib/scss-tokenize"

import { syntaxTokenizesInlineComments } from "../readsInlineComments/index.ts"

/** The tokenizer of `postcss-scss` as each place it was looked for from answered, `null` where that place has none. */
let scssTokenizers: Map<string, typeof scssTokenizeModule | null> = new Map()

/**
 * Loads the tokenizer of `postcss-scss`, a package the plugin does not depend on: a project that lints no SCSS never installs it, so a static import would keep the whole plugin from loading there, and the package is reached by name at the moment it is needed instead.
 *
 * Where it is reached from matters, since Stylelint looks a syntax up from the configuration that named it while a module looks one up from itself: in a workspace whose packages hold dependencies of their own, the stylesheet's own directory has the package and the plugin's has none. So the stylesheet is asked first and the plugin second, and the answer of each place asked is kept under the path it was asked from.
 * @param from - The file the stylesheet was read from, where the node carries one.
 * @returns The tokenizer, or nothing where neither place has the package.
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
 * Reads a tokenizer to the first colon token standing at or behind a position.
 * @param tokenizer - The tokenizer, standing at the opening of the text.
 * @param start - The position the answer is counted from and looked for at.
 * @returns The index the colon opens at, counted from that position, or `-1` where nothing behind it is one.
 */
function colonIndexPast (tokenizer: Tokenizer, start: number): number {
	while (!tokenizer.endOfFile()) {
		let [name, , openIndex] = tokenizer.nextToken({ ignoreUnclosed: true })

		// A colon stands somewhere in particular, so it carries the index a run of whitespace does not
		if (name === `:` && openIndex !== undefined && openIndex >= start) return openIndex - start
	}

	return -1
}

/**
 * Finds the first character of a text that the parser of a syntax reads as a colon token.
 *
 * The parser builds a declaration by reading tokens from the property until it meets a colon, so a colon it read as text — one inside a comment, a string, a parenthesised group, an at-word or an escape — opens no declaration and is none of the rules' business. Rather than model those readings, the text is handed to the very tokenizer the syntax's parser reads with: PostCSS's for plain CSS and for Less, whose parser takes its inline comments at the statement level and reads none inside a declaration's raws, and `postcss-scss`'s for SCSS, which takes an inline comment and an interpolation in the tokenizer itself.
 *
 * An unclosed construct is read to the end of the text rather than thrown over wherever the tokenizer can be told to: a text handed here is a piece of a stylesheet the parser has already accepted, and the piece may open a string or a parenthesis the rest of the file closes. `postcss-scss` throws over a string and over an interpolation left open whatever it is told, so a text it refuses is read again with PostCSS's tokenizer, which refuses nothing.
 * A syntax whose own tokenizer reads an inline comment is answered by that tokenizer or by nothing at all: reading such a file with PostCSS's would take a comment for code and write a line break into it, which is the harm this reading was written to stop, so where the package cannot be reached the text is answered as holding no colon and every rule passes the declaration over.
 *
 * The text is read with what stands in front of it, since a tokenizer carries state across the two — the word a parenthesis is read against above all — and the answer is the first colon token standing in the text itself: one the reading finds in front of it is a colon the parser never met, that parser having ended the property at a colon of its own.
 * @param before - What stands in front of the text, read but not answered for.
 * @param text - The text to read.
 * @param syntax - The syntax the node's stylesheet was parsed with, as `nodeSyntax` gives it; plain CSS where there is none.
 * @param [from] - The file the stylesheet was read from, which the package is looked for from first.
 * @returns The index in the text of the first colon token, or `-1` where the text holds none.
 */
export function colonTokenIndex (before: string, text: string, syntax?: unknown, from?: string): number {
	let read = `${before}${text}`

	// `postcss-scss` is the one syntax whose tokenizer reads an inline comment: Less spells one too, and keeps it in the text a rule reads, but its parser is what finds it and never looks for one inside a declaration's raws
	if (syntaxTokenizesInlineComments(syntax)) {
		let tokenize = scssTokenizer(from)

		if (!tokenize) return -1

		try {
			return colonIndexPast(tokenize(new Input(read), { ignoreErrors: true }), before.length)
		}
		catch {
			// That tokenizer throws over a string and over an interpolation left open whatever it is told, and PostCSS's, which refuses nothing, answers instead
		}
	}

	let colonIndex = colonIndexPast(postcssTokenize(new Input(read), { ignoreErrors: true }), before.length)

	// A text no colon token stands in is one the parser cannot have read the way this does — it ended the property at a colon of its own — so the text is read again on its own terms: `postcss-less` hands over a property of its own making, `/*]` where the file spells `{}/;*]`, and the reading in front of the raw then opens a comment over the whole of it. The tokenizer of `postcss-scss` answers before this, its own reading of such a text being the one that syntax's parser had
	if (colonIndex === -1 && before !== ``) return colonIndexPast(postcssTokenize(new Input(text), { ignoreErrors: true }), 0)

	return colonIndex
}
