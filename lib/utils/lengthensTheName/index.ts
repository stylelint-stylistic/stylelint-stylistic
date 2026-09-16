import { VALUE_PARSER_WORD_END } from "../../regexps.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"
import { joinsTheName } from "../joinsTheName/index.ts"

/**
 * Asks whether a name standing behind a text is the tail of a longer word to PostCSS's tokenizer and to `postcss-value-parser` alike, so that `$url(` and `!url(` open a call as `aurl(` does: a sign the tokenizer glues to the name and the value parser keeps in the word. Behind a comma, a solidus or a control character the value parser parts the name off, and behind the first two Less reads an address; inside `calc()` it parts a star off too, where reading a call only declines. Under `postcss-scss` Sass decides.
 * @param text - The text in front of the name.
 * @param reading - Whether the parser reads by a tokenizer of its own.
 * @returns True where no address opens behind the text.
 */
export function lengthensTheName (text: string, reading: Pick<CommentReading, `tokenizes`>): boolean {
	return !reading.tokenizes && joinsTheName(text, reading) && !VALUE_PARSER_WORD_END.test(text.at(-1) as string)
}
