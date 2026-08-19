/**
 * Empties every quoted run of a selector and takes out every comment, keeping the length of
 * what stood there, so that neither an attribute value nor a comment can be read as selector
 * syntax.
 *
 * A comment goes with its delimiters, since the two of them standing side by side spell the
 * double slash of an inline comment between them: `/*one*\//*two*\/` is two comments and no
 * comment of that kind at all. A double slash is read before a comment is, so that the second
 * slash of one cannot open a block comment either: `a//*x*\/b` is an inline comment and the
 * text of it, whatever the text spells.
 *
 * An escape is read before a quotation mark is, so that a quote escaped outside a string —
 * the one in `.x\\'y`, which Less takes for a class of that name — opens nothing, and the
 * code standing behind it is read as the code it is.
 *
 * The `s` flag is what lets a backslash escape a line break, as a string spanning more than
 * one line does; without it such a string would not be recognised at all, and its text would
 * go on being read as selector syntax.
 * @param {string} selector - The selector to blank the quoted text and the comments of.
 * @returns {string} The selector with the text inside each pair of quotes, and each comment, replaced by spaces.
 */
export function withoutQuotedTextAndComments (selector) {
	return selector.replaceAll(/\\.|\/\/|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu, (match) => {
		if (match.startsWith(`\\`) || match === `//`) return match

		if (match.startsWith(`/*`)) return ` `.repeat(match.length)

		return match[0] + ` `.repeat(match.length - 2) + match[0]
	})
}
