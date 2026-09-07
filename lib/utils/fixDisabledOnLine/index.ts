import type { PostcssResult } from "stylelint"

/** The name a disable comment names every rule by. */
const EVERY_RULE = `all`

/** A range a disable comment opens in the file, as Stylelint files it: the lines it runs over, and the rules it names where it names some. */
type DisabledRange = {
	start: number,
	end?: number | undefined,
	rules?: string[] | undefined,
}

/**
 * Asks whether Stylelint would decline a rule's fix on a line, over what a disable comment has silenced.
 *
 * Stylelint applies no fix inside a range a `stylelint-disable` comment opens over the rule, or over every rule, unless the configuration says `ignoreDisables`; the report is dropped there and the fix with it. So a reader of a neighbour's setting that takes the neighbour for one about to write has to ask this as well as whether the configuration turned the neighbour's fix off: a neighbour a disable comment silences over the node writes nothing there, however the configuration lists it, and a reader that counted its write in would read a file the neighbour never makes — and one that acted on that reading, a boundary above all, would write on every run of `--fix` towards a file that never comes (#536).
 *
 * The ranges are read the way `report` reads them: the rule's own, and every rule's where the rule has none of its own, each running from its first line to its last where it has one, and open-ended where it has none.
 * @param result - The Stylelint result, which holds the configuration and the ranges the disable comments opened.
 * @param ruleName - The name the rule is registered under.
 * @param line - The line the rule would report on.
 * @returns True where a disable comment keeps the rule's fix off that line.
 */
export function fixDisabledOnLine (result: PostcssResult, ruleName: string, line: number): boolean {
	let stylelint = result.stylelint as { config?: { ignoreDisables?: boolean }, disabledRanges?: Record<string, DisabledRange[]> } | undefined

	if (stylelint?.config?.ignoreDisables) return false

	let ranges = stylelint?.disabledRanges?.[ruleName] ?? stylelint?.disabledRanges?.[EVERY_RULE] ?? []

	return ranges.some((range) => range.start <= line && (range.end === undefined || range.end >= line) && (!range.rules || range.rules.includes(ruleName)))
}
