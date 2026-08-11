/**
 * Checks whether the last thing a raw string holds is an inline comment.
 *
 * An inline comment is closed by a line break and by nothing else, so whatever a fixer
 * would put after it — a space, a brace, a colon, a semicolon — ends up inside the comment
 * instead. Trailing whitespace does not close it either, and is therefore ignored here.
 * @param {string} source - The raw string to look at, a `raws` value or a part of one.
 * @returns {boolean} True if the string ends with an inline comment.
 */
export function endsWithInlineComment (source) {
	// The order matters: whitespace goes first, or a block comment cut out afterwards would
	// uncover the line break of an earlier inline comment and pass it off as the trailing run
	let withoutTrailingWhitespace = source.replace(/\s*$/u, ``)
	// A block comment may hold a double slash of its own, in an URL for one, and must not count
	let withoutBlockComments = withoutTrailingWhitespace.replaceAll(/\/\*[\s\S]*?\*\//gu, ``)

	return (/\/\/[^\n]*$/u).test(withoutBlockComments)
}
