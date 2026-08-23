import { EVERY_ESCAPE_STRING_OR_COMMENT } from "../../regexps.js"

/**
 * Empties every quoted run of a text and takes out every comment, keeping the length of what stood there, so that neither the text inside a pair of quotes nor the text of a comment is read as the code around it — an attribute value taken for selector syntax, where a selector is what is handed over, and a line break taken for the file's own, where the whole file is.
 *
 * A comment goes with its delimiters, since the two of them standing side by side spell the double slash of an inline comment between them: `/*one*\//*two*\/` is two comments and no comment of that kind at all. A double slash is read before a comment is, so that the second slash of one cannot open a block comment either: `a//*x*\/b` is an inline comment and the text of it, whatever the text spells.
 *
 * An escape is read before a quotation mark is, so that a quote escaped outside a string — the one in `.x\\'y`, which Less takes for a class of that name — opens nothing, and the code standing behind it is read as the code it is.
 *
 * The `s` flag is what lets a backslash escape a line break, as a string spanning more than one line does; without it such a string would not be recognised at all, and its text would go on being read as the code around it.
 * @param {string} text - The text to blank the quoted runs and the comments of.
 * @returns {string} The text with what stands inside each pair of quotes, and each comment, replaced by spaces.
 */
export function withoutQuotedTextAndComments (text) {
	return text.replaceAll(EVERY_ESCAPE_STRING_OR_COMMENT, (match) => {
		if (match.startsWith(`\\`) || match === `//`) return match

		if (match.startsWith(`/*`)) return ` `.repeat(match.length)

		return match[0] + ` `.repeat(match.length - 2) + match[0]
	})
}
