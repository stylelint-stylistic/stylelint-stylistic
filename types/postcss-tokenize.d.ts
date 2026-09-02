// PostCSS and `postcss-scss` export their tokenizers as entry points of their own and ship no declaration for either, so what the plugin reads of them is declared here: the call, and the three fields of a token it reads. A token is an array whose first field names it — `:` for a colon, `word`, `comment`, `brackets` and the rest — with its text behind it. A token that stands somewhere in particular carries the position it opens at third and, where it spans several characters, the one it ends at fourth; a run of whitespace carries neither, and the type spells the fields as far as the one this reads and no further.
declare module "postcss/lib/tokenize" {
	import type { Input } from "postcss"

	/** One token: what it is, the text it holds, and — on a token that stands somewhere in particular — the index it opens at. */
	type Token = [string, string, number?]

	interface Tokenizer {

		/** Whether the whole text has been read. */
		endOfFile (): boolean,

		/** Reads the next token. */
		nextToken (options?: { ignoreUnclosed?: boolean }): Token,

	}

	/**
	 * Reads a text the way PostCSS's parser reads it.
	 * @param input - The text, wrapped in PostCSS's `Input`.
	 * @param [options] - `ignoreErrors` lets an unclosed construct pass rather than throwing.
	 * @returns The tokenizer.
	 */
	function tokenize (input: Input, options?: { ignoreErrors?: boolean }): Tokenizer

	export default tokenize
	export type { Tokenizer }
}

declare module "postcss-scss/lib/scss-tokenize" {
	import type { Input } from "postcss"
	import type { Tokenizer } from "postcss/lib/tokenize"

	/**
	 * Reads a text the way `postcss-scss`'s parser reads it: an inline comment is a token of its own there, and an interpolation is one word.
	 * @param input - The text, wrapped in PostCSS's `Input`.
	 * @param [options] - `ignoreErrors` lets an unclosed construct pass rather than throwing.
	 * @returns The tokenizer.
	 */
	function scssTokenize (input: Input, options?: { ignoreErrors?: boolean }): Tokenizer

	export default scssTokenize
}
