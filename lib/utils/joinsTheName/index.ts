import { Input } from "postcss"
import tokenize, { type Tokenizer } from "postcss/lib/tokenize"

import { AT_WORD_AT_END, TOKENIZER_TOKEN_END } from "../../regexps.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"

/**
 * Asks whether the text's last token is a comment to PostCSS's tokenizer, which `postcss-less` reads by too: a `*\/` closing none, as in `1 *\/url` or behind a string or a bare address holding the `/*`, is text of a word. `postcss-scss`'s tokenizer parts from this reading only inside a `//` comment, where no rule writes.
 * @param text - The text.
 * @returns True where a comment closes at the text's end.
 */
function endsWithAComment (text: string): boolean {
	let tokenizer = tokenize(new Input(text), { ignoreErrors: true })
	let last: ReturnType<Tokenizer[`nextToken`]> | undefined

	while (!tokenizer.endOfFile()) last = tokenizer.nextToken()

	return last?.[0] === `comment`
}

/**
 * Asks whether the word the tokenizer reads in front of a `url` standing behind a text is `url` itself. A comment's closing delimiter ends the word in front of it, and so is an escaped character read here, which the tokenizer takes as a word of its own unless it is a solidus; `postcss-scss`'s tokenizer ends a word on a comma too, but not an at-word.
 * @param text - The text in front of the name.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns True where a character joins the name into a longer word.
 */
export function joinsTheName (text: string, reading: Pick<CommentReading, `tokenizes`>): boolean {
	let last = text.at(-1)

	if (last === undefined || TOKENIZER_TOKEN_END.test(last) || (text.endsWith(`*/`) && endsWithAComment(text))) return false

	let backslashes = 0

	while (text.at(-2 - backslashes) === `\\`) backslashes += 1

	if (backslashes % 2 === 1) return false

	return !(reading.tokenizes && last === `,`) || AT_WORD_AT_END.test(text)
}
