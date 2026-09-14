/**
 * Finds the break closing a `//` comment: the line feed, or the `\r` in front of it. A bare `\r` and a form feed are text of the comment ([#566](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/566)).
 * @param text - The text the comment opened in.
 * @param openIndex - Where the comment opens.
 * @returns The break, or the text's length.
 */
export function findInlineCommentEnd (text: string, openIndex: number): number {
	let index = text.indexOf(`\n`, openIndex)

	if (index === -1) return text.length

	return text[index - 1] === `\r` ? index - 1 : index
}
