/**
 * Skips a quoted string; an escaped quote closes nothing.
 * @param text - The text holding the string.
 * @param openIndex - The opening quote.
 * @returns Behind the closing quote, or one past the text's end where no quote closes it.
 */
export function skipString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}
