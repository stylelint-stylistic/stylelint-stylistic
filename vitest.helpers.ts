import stylelint from "stylelint"

import plugins from "./lib/index.ts"

/**
 * Takes one item out of a list a test knows to hold it, and says so where the list does not.
 * @param list - The items.
 * @param index - Which of them; the first where none is named.
 * @returns That item.
 */
export function pick<T> (list: readonly T[], index = 0): T {
	let item = list[index]

	if (item === undefined) throw new Error(`The list holds no item at ${index}`)

	return item
}

/**
 * Fixes a stylesheet under two rules, once in each order the configuration can list them, and reports what is left.
 * @param ruleName - The rule under test, by its configured name.
 * @param code - The stylesheet.
 * @param option - The rule's primary option.
 * @param neighbor - The other rule's configured name.
 * @param setting - The other rule's configured value.
 * @returns What each order wrote, and the warnings the first order left over its own output.
 */
export async function race (ruleName: string, code: string, option: unknown, neighbor: string, setting: unknown): Promise<{
	ours: string | undefined,
	theirs: string | undefined,
	left: string[],
}> {
	let ours = await stylelint.lint({ code, config: { plugins, rules: { [ruleName]: option, [neighbor]: setting } }, fix: true })
	let theirs = await stylelint.lint({ code, config: { plugins, rules: { [neighbor]: setting, [ruleName]: option } }, fix: true })
	let again = await stylelint.lint({ code: ours.code ?? code, config: { plugins, rules: { [ruleName]: option, [neighbor]: setting } } })

	return { ours: ours.code, theirs: theirs.code, left: pick(again.results).warnings.map((warning) => warning.text) }
}
