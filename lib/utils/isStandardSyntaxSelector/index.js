import { hasInterpolation } from "../hasInterpolation/index.js"

/**
 * Checks whether a selector is standard (i.e. not a preprocessor construct).
 * @param {string} selector - The selector to check.
 * @returns {boolean} True if the selector is standard syntax, false otherwise.
 */
export function isStandardSyntaxSelector (selector) {
	// SCSS or Less interpolation
	if (hasInterpolation(selector)) return false

	// An attribute value may quote any text at all, and a comment may hold any text at all,
	// and none of it is selector syntax. So the checks that match on text rather than on shape
	// are made against a copy with the quoted runs emptied and the comments taken out. The
	// copy keeps its length, and the quotes stay where they are, so a check describing a shape
	// reads the same selector either way.
	let code = withoutQuotedTextAndComments(selector)

	// SCSS placeholder selectors
	if (code.startsWith(`%`)) return false

	// SCSS nested properties
	if (code.endsWith(`:`)) return false

	// Less :extend()
	if ((/:extend(?:\(.*?\))?/u).test(code)) return false

	// Less mixin with resolved nested selectors (e.g. .foo().bar or .foo(@a, @b)[bar])
	if ((/\.[\w-]+\(.*\).+/u).test(code)) return false

	// Less non-outputting mixin definition (e.g. .mixin() {})
	if (code.endsWith(`)`) && !code.includes(`:`)) return false

	// Less Parametric mixins (e.g. .mixin(@variable: x) {})
	if ((/\(@.*\)$/u).test(code)) return false

	// Less CSS guards (e.g. .mixin when (@a > 0) {}).
	// The two rules above catch a guard only by accident — one because the selector ends
	// in a parenthesis and carries no colon, the other because the condition names a
	// variable — and a guard such as `.a:hover when (1 = 1)` answers to neither.
	// A parenthesis opening after whitespace is nothing CSS has a selector for, and Less
	// asks for no whitespace in front of the condition — `.a:hover when(1 = 1)` compiles
	// as readily as the spaced form. The word itself is matched in any case, which is one
	// case too many, since Less reads its keywords in lower case only: that is #168.
	if ((/\swhen\s*(?:not\s*)?\(/iu).test(code)) return false

	// ERB template tags
	if (code.includes(`<%`) || code.includes(`%>`)) return false

	//  SCSS and Less comments
	if (code.includes(`//`)) return false

	return true
}

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
function withoutQuotedTextAndComments (selector) {
	return selector.replaceAll(/\\.|\/\/|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu, (match) => {
		if (match.startsWith(`\\`) || match === `//`) return match

		if (match.startsWith(`/*`)) return ` `.repeat(match.length)

		return match[0] + ` `.repeat(match.length - 2) + match[0]
	})
}
