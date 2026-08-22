import { LINE_BREAK } from "../../regexps.js"

/**
 * Answers whether a text holds no line break, and so stands on one line. The three characters counted are the ones every syntax the plugin reads through ends a line on, a form feed among them, so that a construct broken with one is multi-line to every `*-single-line` and `*-multi-line` option alike.
 * @param {string} input - The text to measure.
 * @returns {boolean} True where the text holds no line break, false where it holds one.
 */
export function isSingleLineString (input) {
	return !LINE_BREAK.test(input)
}
