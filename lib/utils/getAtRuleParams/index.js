/**
 * Gets the params of an at-rule, spelled as the file spells them.
 *
 * `postcss-scss` rewrites every `//` comment of a set of parameters into a block comment inside `raws.params.raw`, keeps the spelling of the file in `raws.params.scss` and prints that second copy. The copy that is printed is the one a rule has to read: it is the text the file holds, the text the positions of a warning are counted in, and the only text a fix can reach.
 * @param {import('postcss').AtRule} atRule - The at-rule node.
 * @returns {string} The at-rule params, including any comment dropped from the property.
 */
export function getAtRuleParams (atRule) {
	let raws = atRule.raws

	if (!raws.params) return atRule.params

	if (typeof raws.params.scss === `string`) return raws.params.scss

	return raws.params.raw || atRule.params
}
