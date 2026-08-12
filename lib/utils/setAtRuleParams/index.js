/** @typedef {import('postcss').AtRule} AtRule */

/**
 * Sets the params of an at-rule.
 * @param {AtRule} atRule - The at-rule node.
 * @param {string} params - The new params to set.
 * @returns {AtRule} The at-rule that was passed in.
 */
export function setAtRuleParams (atRule, params) {
	let raws = atRule.raws

	if (raws.params) raws.params.raw = params
	else atRule.params = params

	return atRule
}
