import type { AtRule } from "postcss"

/**
 * Gets the index of the parameters in an at-rule.
 * @param atRule - The at-rule.
 * @returns The index.
 */
export function atRuleParamIndex (atRule: AtRule): number {
	// 1 for the `@`
	let index = 1 + atRule.name.length

	if (atRule.raws.afterName) index += atRule.raws.afterName.length

	return index
}
