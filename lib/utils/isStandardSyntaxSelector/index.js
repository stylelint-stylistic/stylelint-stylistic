import { hasInterpolation } from "../hasInterpolation/index.js"

/**
 * Checks whether a selector is standard (i.e. not a preprocessor construct).
 * @param {string} selector - The selector to check.
 * @returns {boolean} True if the selector is standard syntax, false otherwise.
 */
export function isStandardSyntaxSelector (selector) {
	// SCSS or Less interpolation
	if (hasInterpolation(selector)) return false

	// SCSS placeholder selectors
	if (selector.startsWith(`%`)) return false

	// SCSS nested properties
	if (selector.endsWith(`:`)) return false

	// Less :extend()
	if ((/:extend(?:\(.*?\))?/u).test(selector)) return false

	// Less mixin with resolved nested selectors (e.g. .foo().bar or .foo(@a, @b)[bar])
	if ((/\.[\w-]+\(.*\).+/u).test(selector)) return false

	// Less non-outputting mixin definition (e.g. .mixin() {})
	if (selector.endsWith(`)`) && !selector.includes(`:`)) return false

	// Less Parametric mixins (e.g. .mixin(@variable: x) {})
	if ((/\(@.*\)$/u).test(selector)) return false

	// Less CSS guards (e.g. .mixin when (@a > 0) {}).
	// The two rules above catch a guard only by accident — one because the selector ends
	// in a parenthesis and carries no colon, the other because the condition names a
	// variable — and a guard such as `.a:hover when (1 = 1)` answers to neither.
	// A parenthesis opening after whitespace is nothing CSS has a selector for, whatever
	// the case of the word in front of it, but an attribute value may quote any text at
	// all, so the quoted parts are blanked first.
	if ((/\swhen\s+(?:not\s+)?\(/iu).test(withoutQuotedText(selector))) return false

	// ERB template tags
	if (selector.includes(`<%`) || selector.includes(`%>`)) return false

	//  SCSS and Less comments
	if (selector.includes(`//`)) return false

	return true
}

/**
 * Empties every quoted run of a selector, keeping the quotes and the length of what
 * stood between them, so that an attribute value cannot be read as selector syntax.
 *
 * The `s` flag is what lets a backslash escape a line break, as a string spanning
 * more than one line does; without it such a string would not be recognised at all,
 * and its text would go on being read as selector syntax.
 * @param {string} selector - The selector to blank the quoted text of.
 * @returns {string} The selector with the text inside each pair of quotes replaced by spaces.
 */
function withoutQuotedText (selector) {
	return selector.replaceAll(/"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'/gsu, (quoted) => quoted[0] + ` `.repeat(quoted.length - 2) + quoted[0])
}
