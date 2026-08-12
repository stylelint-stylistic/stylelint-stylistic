/**
 * Gets the params of an at-rule.
 * @param {import('postcss').AtRule} atRule - The at-rule node.
 * @returns {string} The at-rule params, including any comment dropped from the property.
 */
export function getAtRuleParams (atRule) {
	let raws = atRule.raws

	return (raws.params && raws.params.raw) || atRule.params
}
