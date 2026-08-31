import type { AtRule as PostcssAtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

export type AtRule = PostcssAtRule | LessAtRule

/**
 * Mirrors the params just written to an at-rule into the value that `postcss-less` prints.
 *
 * A Less variable (`@foo: "bar";`) is given two copies of its text, `params` and `value`, and the Less stringifier discards `params`, so a fix written to `params` alone never reaches the output.
 * @param atRule - The at-rule whose params have just been set.
 * @param params - The text that was written to the params.
 * @returns The at-rule that was passed in.
 */
export function syncLessVariableValue (atRule: AtRule, params: string): AtRule {
	if (`variable` in atRule && atRule.variable) atRule.value = params

	return atRule
}
