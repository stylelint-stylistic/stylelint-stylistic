import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.ts"

/**
 * Checks whether an at-rule is standard (i.e. not a preprocessor construct).
 * @param atRule - The at-rule node to check.
 * @returns True if the at-rule is standard, false otherwise.
 */
export function isStandardSyntaxAtRule (atRule: import("postcss").AtRule | import("postcss-less").AtRule): boolean {
	// Ignore scss `@content` inside mixins
	if (!atRule.nodes && atRule.params === ``) return false

	// Ignore Less mixins
	if (`mixin` in atRule && atRule.mixin) return false

	// Ignore Less variables and calls to detached rulesets `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`
	if ((`variable` in atRule && atRule.variable) || isLessDetachedRulesetCall(atRule)) return false

	return true
}
