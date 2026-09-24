import type { CommentReading } from "../findCommentSpans/index.ts"
import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * The character the file's parser reads at an index, which is {@link readIdentifierCharacter}'s answer everywhere but in front of a comment's opening delimiter.
 *
 * The grammar lets a backslash escape every character but a line break, so `\/` spells a solidus and `lightningcss` prints `url(a\/b.png)` as `url(a/b.png)`. PostCSS's tokenizer lets no escape cover a solidus at all: the backslash ends the word it stands in and the solidus opens whatever it opens, so `\/*` is a comment to it, to `postcss-scss` and to `postcss-less` alike, all three handing back a declaration with the comment cut out of its value.
 *
 * Only a comment's delimiter is read that way here, where the tokenizer refuses every solidus: a block comment's always, and a `//` comment's where the syntax's own tokenizer reads one, which is `postcss-scss`; Less and Sass read that escape, and `postcss-less` keeps it in the value. Reading a lone `\/` the tokenizer's way would make `\/url(` an address, where the word standing in front of the parenthesis is `/url` and no address opens for anyone.
 * @param text - The text the character is read from.
 * @param index - The index it is read at.
 * @param reading - What the syntax makes of a `//` comment; by default no tokenizer of its own reads one.
 * @returns The character, or nothing where the backslash spells none, and the index behind it.
 */
export function readEscapedCharacter (text: string, index: number, reading?: CommentReading): {
	character: string | undefined,
	end: number,
} {
	if (text[index] === `\\` && text[index + 1] === `/` && text[index + 2] === `*`) return { character: undefined, end: index + 1 }

	if (text[index] === `\\` && reading?.spells && reading.tokenizes && text.startsWith(`//`, index + 1)) return { character: undefined, end: index + 1 }

	return readIdentifierCharacter(text, index)
}
