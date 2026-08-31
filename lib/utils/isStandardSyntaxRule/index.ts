import type { Rule } from "postcss"

import { isStandardSyntaxSelector } from "../isStandardSyntaxSelector/index.ts"

/**
 * Checks whether a Node is a standard rule.
 * @param rule - The rule node to check.
 * @returns True if the rule is standard syntax, false otherwise.
 */
export function isStandardSyntaxRule (rule: Rule): boolean {
	if (rule.type !== `rule`) return false

	if (!isStandardSyntaxSelector(rule.selector)) return false

	return true
}
