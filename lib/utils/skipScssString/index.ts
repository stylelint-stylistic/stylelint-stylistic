import { skipString } from "../skipString/index.ts"

/**
 * Skips a Sass interpolation as `postcss-scss`'s tokenizer reads one: a string inside it, with its escapes, and a nested interpolation are its text.
 * @param text - The text holding the interpolation.
 * @param openIndex - The `#`.
 * @returns Behind its closing brace, or the text's length where nothing closes it.
 */
export function skipScssInterpolation (text: string, openIndex: number): number {
	let depth = 1
	let index = openIndex + 2

	while (index < text.length) {
		let character = text[index]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)

			continue
		}

		if (character === `}`) {
			depth -= 1

			if (depth === 0) return index + 1
		}
		else if (character === `#` && text[index + 1] === `{`) {
			depth += 1
		}

		index += 1
	}

	return text.length
}

/**
 * Skips a string as `postcss-scss`'s tokenizer reads one: an escaped quotation mark closes nothing, and an interpolation inside it is its text, strings of its own included.
 * @param text - The text holding the string.
 * @param openIndex - The opening quote.
 * @returns Behind the closing quote, or one past the text's end where no quote closes it.
 */
export function skipScssString (text: string, openIndex: number): number {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) {
		if (text[index] === `\\`) index += 2
		else if (text[index] === `#` && text[index + 1] === `{`) index = skipScssInterpolation(text, index)
		else index += 1
	}

	return index + 1
}
