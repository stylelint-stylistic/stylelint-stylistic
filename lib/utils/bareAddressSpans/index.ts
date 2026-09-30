import { ENDS_WITH_ESCAPE, EVERY_BARE_ADDRESS_OPENING, TRAILING_BACKSLASHES } from "../../regexps.ts"
import { skipScssInterpolation } from "../skipScssString/index.ts"

/** A span of a text. */
type Span = { start: number, end: number }

/**
 * Finds the parentheses of every bare address of a text, as the compilers read one ({@link EVERY_BARE_ADDRESS_OPENING}), up to the first `)` no backslash escapes, or to the end of the text. An escape closing right in front of the name, as `\61 url(` spells `aurl(`, is a character of a longer name, which the whitespace it ends with hides from the opener.
 *
 * What stands between the parentheses is the address's text, which Less hands on as it is, save a run right behind the opening parenthesis, which it trims, Sass reads with its whitespace collapsed and lightningcss refuses as a bad url token where whitespace stands inside: no rule writing whitespace writes there. A Sass interpolation inside is code to Sass, whose whitespace it reads as any expression's, so an address holding one comes back in pieces, the interpolation left out. The text is read with its comments blanked, so a `url(` inside a comment opens none.
 * @param text - The text, its comments blanked.
 * @returns The spans, each from the `(` to behind the `)`, or in pieces around the interpolations.
 */
export function bareAddressSpans (text: string): Span[] {
	let spans: Span[] = []

	for (let match of text.matchAll(EVERY_BARE_ADDRESS_OPENING)) {
		if (ENDS_WITH_ESCAPE.test(text.slice(0, match.index))) continue

		let start = match.index + match[0].length - 1
		let end = start

		// A `)` behind an odd run of backslashes is escaped, a character of the address
		do end = text.indexOf(`)`, end + 1)
		while (end !== -1 && (text.slice(start, end).match(TRAILING_BACKSLASHES)?.[0].length ?? 0) % 2 === 1)

		spans.push(...aroundInterpolations(text, { start, end: end === -1 ? text.length : end + 1 }))
	}

	return spans
}

/**
 * Cuts the Sass interpolations out of a span.
 * @param text - The text.
 * @param span - The span.
 * @returns The pieces around each `#{…}`, or the span itself where it holds none.
 */
function aroundInterpolations (text: string, span: Span): Span[] {
	let pieces: Span[] = []
	let index = span.start

	for (let at = text.indexOf(`#{`, span.start); at !== -1 && at < span.end; at = text.indexOf(`#{`, index)) {
		let closed = Math.min(skipScssInterpolation(text, at), span.end)

		if (at > index) pieces.push({ start: index, end: at })

		index = closed
	}

	if (index < span.end) pieces.push({ start: index, end: span.end })

	return pieces
}
