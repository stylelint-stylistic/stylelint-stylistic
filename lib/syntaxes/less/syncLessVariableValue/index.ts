import type { AtRule as PostcssAtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

export type AtRule = PostcssAtRule | LessAtRule

/**
 * Mirrors an at-rule's params into `value`: a Less variable carries both, and the stringifier prints `value` alone.
 * @param atRule - The at-rule.
 * @param params - The text written to its params.
 * @returns The at-rule.
 */
export function syncLessVariableValue (atRule: AtRule, params: string): AtRule {
	if (`variable` in atRule && atRule.variable) atRule.value = params

	return atRule
}
