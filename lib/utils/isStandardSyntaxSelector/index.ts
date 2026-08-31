import { hasInterpolation } from "../hasInterpolation/index.ts"
import { withoutQuotedTextAndComments } from "../withoutQuotedTextAndComments/index.ts"

/**
 * Checks whether a selector is standard (i.e. not a preprocessor construct).
 * @param selector - The selector to check.
 * @returns True if the selector is standard syntax, false otherwise.
 */
export function isStandardSyntaxSelector (selector: string): boolean {
	// An attribute value may quote any text at all, and a comment may hold any text at all, and none of it is selector syntax. So the checks that match on text rather than on shape are made against a copy with the quoted runs emptied and the comments taken out. The copy keeps its length, and the quotes stay where they are, so a check describing a shape reads the same selector either way.
	return isStandardSyntaxSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The same reading over a copy the caller has already emptied, so that a caller stacking further checks on the same copy blanks the selector once.
 * @param code - The selector, its quoted runs emptied and its comments taken out.
 * @returns True if the selector is standard syntax, false otherwise.
 */
export function isStandardSyntaxSelectorCode (code: string): boolean {
	// SCSS or Less interpolation
	if (hasInterpolation(code)) return false

	// A selector closing on a parenthesis and carrying no colon — the shape of a Less non-outputting mixin definition (e.g. `.mixin() {}`). The reading stays here after the namespaces took their own guards, since taking a shape test out of the core would change what the core reports over plain CSS.
	if (code.endsWith(`)`) && !code.includes(`:`)) return false

	// ERB template tags
	if (code.includes(`<%`) || code.includes(`%>`)) return false

	//  SCSS and Less comments
	if (code.includes(`//`)) return false

	return true
}
