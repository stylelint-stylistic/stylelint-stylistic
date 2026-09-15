import { INLINE_COMMENT_BREAK } from "../../regexps.ts"

/**
 * Finds the break closing a `//` comment: {@link INLINE_COMMENT_BREAK}, the `\r` of a Windows pair included. A form feed is text of the comment ([#566](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566)).
 * @param text - The text the comment opened in.
 * @param openIndex - Where the comment opens.
 * @returns The break, or the text's length.
 */
export function findInlineCommentEnd (text: string, openIndex: number): number {
	let index = text.slice(openIndex).search(INLINE_COMMENT_BREAK)

	return index === -1 ? text.length : openIndex + index
}
