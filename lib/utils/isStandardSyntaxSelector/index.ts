import { hasInterpolation } from "../hasInterpolation/index.ts"
import { withoutQuotedTextAndComments } from "../withoutQuotedTextAndComments/index.ts"

/**
 * Checks whether a selector is standard, not a preprocessor construct.
 * @param selector - The text as parsed, comments and strings in place.
 * @returns True where it is standard.
 */
export function isStandardSyntaxSelector (selector: string): boolean {
	// The checks read a copy with quoted runs emptied and comments blanked, since either may hold any text; it keeps its length and quotes
	return isStandardSyntaxSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The reading over a copy the caller has blanked, so stacked checks blank once.
 * @param code - The blanked selector.
 * @returns True where it is standard.
 */
export function isStandardSyntaxSelectorCode (code: string): boolean {
	// SCSS or Less interpolation
	if (hasInterpolation(code)) return false

	// A Less mixin definition, `.mixin() {}`; kept in the core, since taking it out would change what it reports over plain CSS
	if (code.endsWith(`)`) && !code.includes(`:`)) return false

	// ERB template tags
	if (code.includes(`<%`) || code.includes(`%>`)) return false

	// SCSS and Less comments
	if (code.includes(`//`)) return false

	return true
}
