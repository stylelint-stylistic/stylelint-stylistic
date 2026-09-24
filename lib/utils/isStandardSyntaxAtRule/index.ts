import type { AtRule } from "postcss"

import { CHARSET_AT_RULE_NAME } from "../../regexps.ts"

/**
 * Checks for a standard at-rule: one plain CSS reads as an at-rule at all. A `@charset` is none, in any case of its name: the encoding declaration is a byte sequence the decoder reads before anything is parsed, and every other spelling of it is text a browser ignores, so a rule reading an at-rule's own text passes it over and `at-charset-rule-no-invalid` judges the spelling.
 * @param atRule - The at-rule.
 * @returns True where it is.
 */
export function isStandardSyntaxAtRule (atRule: AtRule): boolean {
	return !CHARSET_AT_RULE_NAME.test(atRule.name)
}
