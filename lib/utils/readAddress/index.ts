import { OPENS_WITH_QUOTE } from "../../regexps.ts"

/** The address a `url()`'s parentheses hold. */
export type Address = {

	/** True where a quotation mark opens it, whitespace aside: the marks are its own, and what stands behind it inside the parentheses is code. */
	isQuoted: boolean,

	/** The opening quotation mark, or the `)` closing a bare address — the text's length where no `)` stands. */
	index: number,
}

/**
 * Reads the address a `url()`'s parentheses hold, the one reading the comment walk and the `//`-comment guard both ask ([#557](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/557)).
 *
 * A quotation mark behind the `(`, whitespace aside, makes the parentheses hold code: the string is the address, and a comment written behind it is a comment, which is how Sass reads it and how the plain-CSS tokenizer reads it where the mark stands against the parenthesis. Everything else is a bare address, whose `//` and `/*` are characters of it, and which the first `)` no escape holds closes — `postcss-scss` alone counts parentheses there, and no compiler takes the text it thereby reads.
 *
 * The whitespace is {@link OPENS_WITH_QUOTE}'s, which is wider than the tokenizer's: a no-break space, a vertical tab and a line separator part the mark from the parenthesis here and not there. That is the declining side of the reading, since both callers pass a comment over, and Sass reads the comment behind all three.
 * @param text - The text holding the call.
 * @param openIndex - Behind the `(`.
 * @returns The reading.
 */
export function readAddress (text: string, openIndex: number): Address {
	let quoted = text.slice(openIndex).match(OPENS_WITH_QUOTE)?.[0]

	if (quoted !== undefined) return { isQuoted: true, index: openIndex + quoted.length - 1 }

	let index = openIndex

	while (index < text.length && text[index] !== `)`) index += text[index] === `\\` ? 2 : 1

	return { isQuoted: false, index: Math.min(index, text.length) }
}
