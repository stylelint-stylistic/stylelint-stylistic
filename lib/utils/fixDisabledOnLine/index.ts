import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

/** The name a disable comment gives every rule. */
const EVERY_RULE = `all`

/** A range a disable comment opens, as Stylelint files it: its lines, and the rules it names if any. */
export type DisabledRange = {
	node?: Node | undefined,
	start: number,
	end?: number | undefined,
	rules?: string[] | undefined,
}

/** The ranges read for a rule, by the list Stylelint filed them in. */
let readRanges = new WeakMap<DisabledRange[], Map<string, DisabledRange[]>>()

/**
 * Asks whether a `stylelint-disable` comment keeps a rule's fix off a line.
 *
 * Stylelint drops the report and fix inside such a range unless `ignoreDisables` is set, so a reader counting a neighbor's write in must ask this too, or it writes on every `--fix` run. The ranges are read as `report` reads them: the rule's own, else every rule's.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @param line - The line the fix would write on, counted from one.
 * @returns True where the fix is kept off the line.
 */
export function fixDisabledOnLine (result: PostcssResult, ruleName: string, line: number): boolean {
	return fixDisabledRanges(result, ruleName).some((range) => range.start <= line && (range.end === undefined || range.end >= line))
}

/**
 * Reads the ranges a `stylelint-disable` comment keeps a rule's fix off, as {@link fixDisabledOnLine} reads them: the rule's own, else every rule's, none under `ignoreDisables`. A range carries the node Stylelint files it with: mostly the comment opening it, but the enable comment for a range an enable opens inside a disable of every rule, the rule or declaration for a comment in its raws, and a detached copy for merged `//` comments.
 * @param result - The Stylelint result.
 * @param ruleName - The registered name.
 * @returns The ranges.
 */
export function fixDisabledRanges (result: PostcssResult, ruleName: string): DisabledRange[] {
	let stylelint = result.stylelint as { config?: { ignoreDisables?: boolean }, disabledRanges?: Record<string, DisabledRange[]> } | undefined

	if (stylelint?.config?.ignoreDisables) return []

	let all = stylelint?.disabledRanges?.[ruleName] ?? stylelint?.disabledRanges?.[EVERY_RULE] ?? []
	// Stylelint files the ranges before any rule runs, so a list read once stands for the run
	let byName = readRanges.get(all) ?? new Map<string, DisabledRange[]>()
	let ranges = byName.get(ruleName) ?? all.filter((range) => !range.rules || range.rules.includes(ruleName))

	byName.set(ruleName, ranges)
	readRanges.set(all, byName)

	return ranges
}
