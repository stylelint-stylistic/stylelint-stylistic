import { readIdentifierCharacter } from "../readIdentifierCharacter/index.ts"

/**
 * The character the file's parser reads at an index, which is {@link readIdentifierCharacter}'s answer everywhere but in front of a block comment's opening delimiter.
 *
 * The grammar lets a backslash escape every character but a line break, so `\/` spells a solidus and `lightningcss` prints `url(a\/b.png)` as `url(a/b.png)`. PostCSS's tokenizer lets no escape cover a solidus at all: the backslash ends the word it stands in and the solidus opens whatever it opens, so `\/*` is a comment to it, to `postcss-scss` and to `postcss-less` alike, all three handing back a declaration with the comment cut out of its value ([#665](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/665)).
 *
 * Only the delimiter of a block comment is read that way here, where the tokenizer refuses every solidus. A `\//` is [#517](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/517)'s question, whose harm falls on the rules about a semicolon; and reading a lone `\/` the tokenizer's way would make `\/url(` an address, where the word standing in front of the parenthesis is `/url` and no address opens for anyone.
 * @param text - The text the character is read from.
 * @param index - The index it is read at.
 * @returns The character, or nothing where the backslash spells none, and the index behind it.
 */
export function readEscapedCharacter (text: string, index: number): {
	character: string | undefined,
	end: number,
} {
	if (text[index] === `\\` && text[index + 1] === `/` && text[index + 2] === `*`) return { character: undefined, end: index + 1 }

	return readIdentifierCharacter(text, index)
}
