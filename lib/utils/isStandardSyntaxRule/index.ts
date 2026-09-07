import type { Rule } from "postcss"

import { isStandardSyntaxSelector } from "../isStandardSyntaxSelector/index.ts"

/**
 * Checks for a standard rule.
 * @param rule - The PostCSS node checked for a rule type and a standard selector.
 * @returns True where it is.
 */
export function isStandardSyntaxRule (rule: Rule): boolean {
	if (rule.type !== `rule`) return false

	if (!isStandardSyntaxSelector(rule.selector)) return false

	return true
}
