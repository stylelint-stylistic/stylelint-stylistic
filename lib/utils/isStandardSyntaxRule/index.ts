import type { Rule } from "postcss"
import type { Rule as LessRule } from "postcss-less"

import { LESS_EXTEND_CALL } from "../../regexps.ts"
import { isStandardSyntaxSelector } from "../isStandardSyntaxSelector/index.ts"
import { withoutQuotedTextAndComments } from "../withoutQuotedTextAndComments/index.ts"

/**
 * Checks whether a Node is a standard rule.
 * @param rule - The rule node to check.
 * @returns True if the rule is standard syntax, false otherwise.
 */
export function isStandardSyntaxRule (rule: Rule | LessRule): boolean {
	if (rule.type !== `rule`) return false

	// Ignore a Less `:extend`, which `postcss-less` marks the rule for by matching the text of its selector, quotes and all — so `[title=":extend(x)"]` carries the mark though what stands inside the quotes is an attribute value and nothing else. The mark is asked of the code instead, of the same copy `isStandardSyntaxSelector` reads, with every quoted run emptied. The case is left as the mark reads it, which is any case at all, though Less reads its keywords in lower case only and prints `.a:EXTEND(.b)` as it stands: the one thing this plugin would write there is the lower case `selector-pseudo-class-case` asks for, and that would turn a selector matching nothing into an extend that changes what Less compiles.
	if (`extend` in rule && rule.extend && LESS_EXTEND_CALL.test(withoutQuotedTextAndComments(rule.selector))) return false

	if (!isStandardSyntaxSelector(rule.selector)) return false

	return true
}
