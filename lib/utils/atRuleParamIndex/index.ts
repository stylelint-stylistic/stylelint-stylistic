import type { AtRule } from "postcss"

/**
 * Reads what an at-rule spells in front of its params: the `@`, the name, and the run behind it.
 * @param atRule - The at-rule.
 * @returns The text.
 */
export function atRuleParamPrefix (atRule: AtRule): string {
	return `@${atRule.name}${atRule.raws.afterName ?? ``}`
}

/**
 * Gets the index of the parameters in an at-rule.
 * @param atRule - The at-rule.
 * @returns The index.
 */
export function atRuleParamIndex (atRule: AtRule): number {
	return atRuleParamPrefix(atRule).length
}
