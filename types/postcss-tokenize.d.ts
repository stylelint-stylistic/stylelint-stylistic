// PostCSS and `postcss-scss` ship their tokenizers with no declaration; what the plugin reads of them is declared here. A token is an array: kind (`word`, `comment`…), text, and the opening index where the token has one; a whitespace run has none.
declare module "postcss/lib/tokenize" {
	import type { Input } from "postcss"

	/** Kind, text, and the opening index where there is one. */
	type Token = [string, string, number?]

	interface Tokenizer {

		/** Whether the whole text has been read. */
		endOfFile (): boolean,

		/** Reads the next token. */
		nextToken (options?: { ignoreUnclosed?: boolean }): Token,

	}

	/**
	 * Reads a text as PostCSS's parser does.
	 * @param input - The text.
	 * @param [options] - `ignoreErrors` passes an unclosed construct.
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
	 * As `tokenize`, for `postcss-scss`: a `//` comment is a token, an interpolation one word.
	 * @param input - The text.
	 * @param [options] - `ignoreErrors` passes an unclosed construct.
	 * @returns The tokenizer.
	 */
	function scssTokenize (input: Input, options?: { ignoreErrors?: boolean }): Tokenizer

	export default scssTokenize
}
