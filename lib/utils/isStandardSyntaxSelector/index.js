import { LESS_EXTEND, LESS_GUARD, LESS_PARAMETRIC_MIXIN, LESS_RESOLVED_MIXIN } from "../../regexps.js"
import { hasInterpolation } from "../hasInterpolation/index.js"
import { withoutQuotedTextAndComments } from "../withoutQuotedTextAndComments/index.js"

/**
 * Checks whether a selector is standard (i.e. not a preprocessor construct).
 * @param {string} selector - The selector to check.
 * @returns {boolean} True if the selector is standard syntax, false otherwise.
 */
export function isStandardSyntaxSelector (selector) {
	// An attribute value may quote any text at all, and a comment may hold any text at all, and none of it is selector syntax. So the checks that match on text rather than on shape are made against a copy with the quoted runs emptied and the comments taken out. The copy keeps its length, and the quotes stay where they are, so a check describing a shape reads the same selector either way.
	let code = withoutQuotedTextAndComments(selector)

	// SCSS or Less interpolation
	if (hasInterpolation(code)) return false

	// SCSS placeholder selectors
	if (code.startsWith(`%`)) return false

	// SCSS nested properties
	if (code.endsWith(`:`)) return false

	// Less :extend()
	if (LESS_EXTEND.test(code)) return false

	// Less mixin with resolved nested selectors (e.g. .foo().bar or .foo(@a, @b)[bar])
	if (LESS_RESOLVED_MIXIN.test(code)) return false

	// Less non-outputting mixin definition (e.g. .mixin() {})
	if (code.endsWith(`)`) && !code.includes(`:`)) return false

	// Less Parametric mixins (e.g. .mixin(@variable: x) {})
	if (LESS_PARAMETRIC_MIXIN.test(code)) return false

	// Less CSS guards (e.g. .mixin when (@a > 0) {}).
	// The two rules above catch a guard only by accident — one because the selector ends in a parenthesis and carries no colon, the other because the condition names a variable — and a guard such as `.a:hover when (1 = 1)` answers to neither.
	// A parenthesis opening after whitespace is nothing CSS has a selector for, and Less asks for no whitespace in front of the condition — `.a:hover when(1 = 1)` compiles as readily as the spaced form. The word is read in lower case only, as Less reads its keywords: `.a:hover WHEN (1 = 1)` is printed by the compiler as it stands, and `when NOT (1 = 1)` is a syntax error to it.
	if (LESS_GUARD.test(code)) return false

	// ERB template tags
	if (code.includes(`<%`) || code.includes(`%>`)) return false

	//  SCSS and Less comments
	if (code.includes(`//`)) return false

	return true
}
