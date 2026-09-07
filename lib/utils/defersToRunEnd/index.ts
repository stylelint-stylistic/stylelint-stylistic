import type { Document, Root } from "postcss"
import type { PostcssResult } from "stylelint"

/** The lineness-conditioned primaries ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)). */
const LINENESS_PRIMARY = /-(?:single|multi)-line$/u

/** The single-line primaries. */
const SINGLE_LINE_PRIMARY = /-single-line$/u

/** The texts a lineness rule reads, innermost first; `linenessRank` packs the index as one character. */
const TEXTS = [`call`, `declaration`, `statement`] as const

/** A rule's lineness text. */
export type Text = typeof TEXTS[number]

/** Every lineness-conditioned rule: the text it counts lines of, and whether its subject is a break; the test beside checks the table. */
export const LINENESS_RULES: Record<string, [text: Text, speaksOfABreak: boolean]> = {
	"at-rule-name-newline-after": [`statement`, true],
	"at-rule-name-space-after": [`statement`, false],
	"block-closing-brace-empty-line-before": [`statement`, true],
	"block-closing-brace-newline-after": [`statement`, true],
	"block-closing-brace-newline-before": [`statement`, true],
	"block-closing-brace-space-after": [`statement`, false],
	"block-closing-brace-space-before": [`statement`, false],
	"block-opening-brace-newline-after": [`statement`, true],
	"block-opening-brace-newline-before": [`statement`, true],
	"block-opening-brace-space-after": [`statement`, false],
	"block-opening-brace-space-before": [`statement`, false],
	"declaration-block-semicolon-newline-after": [`statement`, true],
	"declaration-block-semicolon-newline-before": [`statement`, true],
	"declaration-block-semicolon-space-after": [`statement`, false],
	"declaration-block-semicolon-space-before": [`statement`, false],
	"declaration-colon-newline-after": [`declaration`, true],
	"declaration-colon-space-after": [`declaration`, false],
	"function-comma-newline-after": [`call`, true],
	"function-comma-newline-before": [`call`, true],
	"function-comma-space-after": [`call`, false],
	"function-comma-space-before": [`call`, false],
	"function-parentheses-newline-inside": [`call`, true],
	"function-parentheses-space-inside": [`call`, false],
	"media-query-list-comma-newline-after": [`statement`, true],
	"media-query-list-comma-newline-before": [`statement`, true],
	"media-query-list-comma-space-after": [`statement`, false],
	"media-query-list-comma-space-before": [`statement`, false],
	"selector-list-comma-newline-after": [`statement`, true],
	"selector-list-comma-newline-before": [`statement`, true],
	"selector-list-comma-space-after": [`statement`, false],
	"selector-list-comma-space-before": [`statement`, false],
	"value-list-comma-newline-after": [`declaration`, true],
	"value-list-comma-newline-before": [`declaration`, true],
	"value-list-comma-space-after": [`declaration`, false],
	"value-list-comma-space-before": [`declaration`, false],
	"value-slash-newline-after": [`declaration`, true],
	"value-slash-newline-before": [`declaration`, true],
	"value-slash-space-after": [`declaration`, false],
	"value-slash-space-before": [`declaration`, false],
}

/**
 * Orders two ranks.
 * @param one - One rank.
 * @param other - The rank compared against.
 * @returns As `sort` wants.
 */
export function compareRanks (one: string, other: string): number {
	if (one < other) return -1

	return one > other ? 1 : 0
}

/** A deferred check and its rank. */
type DeferredCheck = {
	rank: string,
	run: () => void,
}

/**
 * Orders two deferred checks by rank.
 * @param one - One check.
 * @param other - The check compared against.
 * @returns As `compareRanks`.
 */
function byRank (one: DeferredCheck, other: DeferredCheck): number {
	return compareRanks(one.rank, other.rank)
}

/** The deferred checks by root: the lineness tier, then readers of every line. Each root of a document flushes on its own. */
let deferred: WeakMap<Document | Root, { lineness: DeferredCheck[], reading: DeferredCheck[] }> = new WeakMap()

/**
 * Returns a root's tiers, made on first use.
 * @param root - The root whose checks are queued.
 * @returns The tiers.
 */
function queuesOf (root: Document | Root): { lineness: DeferredCheck[], reading: DeferredCheck[] } {
	let queues = deferred.get(root)

	if (queues) return queues

	let made = { lineness: [], reading: [] }

	deferred.set(root, made)

	return made
}

/**
 * Ranks a deferred check, so that the plugin rather than the configuration decides the order ([#502](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502)).
 *
 * String order is run order:
 *
 * - the text the check reads, innermost first;
 * - checks about a line break;
 * - checks conditioned on a single-line text;
 * - the rule's name, then its namespace, the core's first.
 *
 * The middle two were measured: of the orders four criteria make, this asks least before the name and leaves no corpus row unsatisfied. The joining space sorts below every character of a name.
 * @param shortName - The rule's name without its namespace.
 * @param namespace - None for the core's.
 * @param primary - One not about lineness ranks as multi-line.
 * @returns The rank.
 */
export function linenessRank (shortName: string, namespace: string | undefined, primary: string): string {
	let [text, speaksOfABreak] = LINENESS_RULES[shortName] ?? [`statement`, false]

	return `${TEXTS.indexOf(text)}${speaksOfABreak ? 0 : 1}${SINGLE_LINE_PRIMARY.test(primary) ? 0 : 1}${shortName} ${namespace ?? ``}`
}

/** Every rule name built; a configured name never built is one Stylelint never calls. */
let registered: Set<string> = new Set()

/**
 * Asks whether a primary defers its check to the run's end: `-single-line` and `-multi-line` read a lineness another rule may still change ([#355](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/355)).
 * @param primary - The rule's configured primary, of any type.
 * @returns True where the check waits.
 */
export function defersToRunEnd (primary: unknown): boolean {
	return typeof primary === `string` && LINENESS_PRIMARY.test(primary)
}

/**
 * Records a rule name as built.
 * @param ruleName - The configured name.
 */
export function registerPluginRule (ruleName: string): void {
	registered.add(ruleName)
}

/**
 * Asks whether a setting enables its rule: `null`, or a `null` primary, is off.
 * @param setting - The rule's configured value: `null`, or a primary with its secondaries.
 * @returns True where the rule runs.
 */
function enables (setting: unknown): boolean {
	return setting !== null && !(Array.isArray(setting) && setting[0] === null)
}

/**
 * Returns the last plugin rule this run calls, where the deferred checks flush; rules run in the configuration's order, those off or never built skipped.
 * @param result - Holds the configuration.
 * @returns The name, or nothing.
 */
export function lastConfiguredPluginRule (result: PostcssResult): string | undefined {
	let settings: Record<string, unknown> = result.stylelint?.config?.rules ?? {}
	let last

	for (let [name, setting] of Object.entries(settings)) {
		if (registered.has(name) && enables(setting)) last = name
	}

	return last
}

/**
 * Defers a check to this root's flush.
 * @param root - The root whose flush runs the check.
 * @param rank - From `linenessRank`.
 * @param run - The check.
 */
export function deferCheck (root: Document | Root, rank: string, run: () => void): void {
	queuesOf(root).lineness.push({ rank, run })
}

/**
 * Defers a check behind the lineness tier, which writes breaks too ([#353](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/353)).
 * @param root - The root whose flush runs the check.
 * @param rank - From `linenessRank`.
 * @param run - The check.
 */
export function deferFinalCheck (root: Document | Root, rank: string, run: () => void): void {
	queuesOf(root).reading.push({ rank, run })
}

/**
 * Runs this root's deferred checks, the lineness tier first, in rank order ([#502](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/502)); both tiers sort, since a rule under two namespaces reads a plain CSS root twice.
 * @param root - The root whose queued checks run.
 */
export function flushDeferredChecks (root: Document | Root): void {
	let queues = deferred.get(root)

	if (!queues) return

	deferred.delete(root)

	for (let { run } of queues.lineness.toSorted(byRank)) run()
	for (let { run } of queues.reading.toSorted(byRank)) run()
}
