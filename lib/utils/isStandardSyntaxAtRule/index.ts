import type { AtRule } from "postcss"

/**
 * Checks whether an at-rule is standard (i.e. not a preprocessor construct).
 * @param atRule - The at-rule node to check.
 * @returns True if the at-rule is standard, false otherwise.
 */
export function isStandardSyntaxAtRule (atRule: AtRule): boolean {
	// Ignore scss `@content` inside mixins
	if (!atRule.nodes && atRule.params === ``) return false

	return true
}
