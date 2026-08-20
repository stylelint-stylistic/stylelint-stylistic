/** @typedef {import('postcss').AtRule} AtRule */

/**
 * Mirrors the params just written to an at-rule into the value that `postcss-less` prints.
 *
 * A Less variable (`@foo: "bar";`) is given two copies of its text, `params` and `value`, and the Less stringifier discards `params`, so a fix written to `params` alone never reaches the output.
 * @param {AtRule} atRule - The at-rule whose params have just been set.
 * @param {string} params - The text that was written to the params.
 * @returns {AtRule} The at-rule that was passed in.
 */
export function syncLessVariableValue (atRule, params) {
	if (`variable` in atRule && atRule.variable) atRule.value = params

	return atRule
}
