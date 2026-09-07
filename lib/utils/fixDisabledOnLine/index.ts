import type { PostcssResult } from "stylelint"

/** The name a disable comment gives every rule. */
const EVERY_RULE = `all`

/** A range a disable comment opens, as Stylelint files it: its lines, and the rules it names if any. */
type DisabledRange = {
	start: number,
	end?: number | undefined,
	rules?: string[] | undefined,
}

/**
 * Asks whether a `stylelint-disable` comment keeps a rule's fix off a line.
 *
 * Stylelint drops the report and fix inside such a range unless `ignoreDisables` is set, so a reader counting a neighbour's write in must ask this too, or it writes on every `--fix` run ([#536](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/536)). The ranges are read as `report` reads them: the rule's own, else every rule's.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @param line - The line the fix would write on, counted from one.
 * @returns True where the fix is kept off the line.
 */
export function fixDisabledOnLine (result: PostcssResult, ruleName: string, line: number): boolean {
	let stylelint = result.stylelint as { config?: { ignoreDisables?: boolean }, disabledRanges?: Record<string, DisabledRange[]> } | undefined

	if (stylelint?.config?.ignoreDisables) return false

	let ranges = stylelint?.disabledRanges?.[ruleName] ?? stylelint?.disabledRanges?.[EVERY_RULE] ?? []

	return ranges.some((range) => range.start <= line && (range.end === undefined || range.end >= line) && (!range.rules || range.rules.includes(ruleName)))
}
