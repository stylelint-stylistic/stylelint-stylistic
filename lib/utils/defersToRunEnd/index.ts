import type { Document, Root } from "postcss"
import type { PostcssResult } from "stylelint"

/** The primaries that condition a rule on a text standing on one line or over several. A rule configured with one reads a lineness another rule of the same run may be about to change, which is what the deferral below exists for (#355). */
const LINENESS_PRIMARY = /-(?:single|multi)-line$/u

/** The primaries that condition a rule on a text standing on one line. */
const SINGLE_LINE_PRIMARY = /-single-line$/u

/** The texts a lineness-conditioned rule reads the lineness of, innermost first: a call's arguments, the declaration around them — its value, or the whole of it as printed — and the statement's own text, which is its block for the rules about braces and semicolons and its prelude for the rules about a selector list, a media query list or an at-rule's name. Where one of these texts stands inside another the order is containment's to fix: a line break put inside a text makes every text around it multi-line, while nothing put outside a text changes that text's own lineness, so the rule reading the innermost text is the one fewest of the others can change the reading of — it speaks first, and the rules reading a wider text then read what it left. Where two of them contain neither the other, a prelude and a declaration's value for one pair, what orders them is the measurement `linenessRank` names rather than containment. The three are packed into that rank as one character each, which holds while there are fewer than ten of them. */
const TEXTS = [`call`, `declaration`, `statement`] as const

/** The text one of those rules reads the lineness of. */
export type Text = typeof TEXTS[number]

/**
 * Every rule that takes a primary conditioned on lineness, with what settles where its check stands among the others put off with it: the text whose lineness it reads, and whether its subject is a line break.
 *
 * The text is the string the rule counts the lines of, however it comes by it: what it hands its checker as `lineCheckStr`, what the checker falls back to as `source`, or what it asks `isSingleLineString` about itself. The subject is what the rule is named for: the `-newline-` family puts a break in or takes one out, and `block-closing-brace-empty-line-before` does the same with an empty line, while a rule about a space speaks of a space, whatever its fix may collapse a break into on the way.
 *
 * Every rule of the plugin that takes such a primary stands here, which the test beside this file holds to by asking the plugin itself which rules take one.
 */
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
}

/**
 * Orders two places, as `linenessRank` spells them.
 * @param one - One of the two.
 * @param other - The other.
 * @returns A negative number where the run makes the first of the two first, a positive one where it makes the other first, and zero where the two share a place.
 */
export function compareRanks (one: string, other: string): number {
	if (one < other) return -1

	return one > other ? 1 : 0
}

/** One check put off to the run's end, of either tier, with the place it takes in its own. */
type DeferredCheck = {
	rank: string,
	run: () => void,
}

/**
 * Orders two checks of one tier by the places they were put off under.
 * @param one - One of the two.
 * @param other - The other.
 * @returns What `compareRanks` answers of their places.
 */
function byRank (one: DeferredCheck, other: DeferredCheck): number {
	return compareRanks(one.rank, other.rank)
}

/** The checks put off until the run's writers have written, by the root they were called with, in two tiers: the lineness-conditioned checks, and behind them the checks that read every line the writers touch. A document's roots are each walked by every rule in turn, so each root's checks live and are flushed on their own. */
let deferred: WeakMap<Document | Root, { lineness: DeferredCheck[], reading: DeferredCheck[] }> = new WeakMap()

/**
 * Reads the queues of one root, making them where the root has none yet.
 * @param root - The root.
 * @returns Its two tiers.
 */
function queuesOf (root: Document | Root): { lineness: DeferredCheck[], reading: DeferredCheck[] } {
	let queues = deferred.get(root)

	if (queues) return queues

	let made = { lineness: [], reading: [] }

	deferred.set(root, made)

	return made
}

/**
 * Names the place a check put off to the run's end takes among the others put off with it, so that the plugin rather than the configuration decides the order they run in (#502). Both tiers are ordered by this — the lineness-conditioned one, and the one that reads every line behind it.
 *
 * A lineness-conditioned check reads a lineness the checks beside it may be about to change, so which of two files the run leaves is decided by which of them speaks first — and the order the configuration spells is what decided it, an order Stylelint keeps for a plugin's rules only because they stand nowhere in the registry it sorts by. The place is spelled so that ordinary string order is the order the run makes:
 *
 * - the text whose lineness the check reads, innermost first, since the innermost reading is the one fewest of the others can change;
 * - the checks whose subject is a line break;
 * - the checks conditioned on a single-line text;
 * - the rule's name, and behind it the namespace it is registered under, the core's first — which is what settles two checks of one rule, since every namespace reads a plain CSS file and a configuration may list the same rule under two of them.
 *
 * Only the first is read off the rules. The middle two are what a measurement settled on rather than anything the code can argue for — a rule about a space collapses a break into a space as readily as a rule about a break writes one. Of the 632 keys four criteria make in every subset, order and polarity, four leave no row of either corpus with a rule unsatisfied, and all four open on the text and then the break; this is the one of them that asks nothing further before the name. Of the 61 and 53 rows where one configuration order used to leave a rule unsatisfied, it leaves none.
 *
 * The name and the namespace are joined by a space, which sorts below every character a rule name spells — that, rather than the space standing in neither field, is what makes the two compare as a pair rather than as the one text they spell together.
 * @param shortName - The rule's short name, the one its directory spells.
 * @param namespace - The namespace the rule is registered under, none for the core's.
 * @param primary - The primary option the rule is configured with; one not conditioned on lineness ranks as a multi-line one, which costs nothing where it happens — in the reading tier, whose members rank alike in every field but the last, `indentation` being the one rule whose definition puts it there.
 * @returns The place, to be read in ordinary string order.
 */
export function linenessRank (shortName: string, namespace: string | undefined, primary: string): string {
	let [text, speaksOfABreak] = LINENESS_RULES[shortName] ?? [`statement`, false]

	return `${TEXTS.indexOf(text)}${speaksOfABreak ? 0 : 1}${SINGLE_LINE_PRIMARY.test(primary) ? 0 : 1}${shortName} ${namespace ?? ``}`
}

/** Every rule name the plugin has built, filled as `defineRule`'s factories run. A configuration may spell a name the plugin never built — a typo Stylelint answers with an unknown-rule warning and never calls — and such a name must not be waited for. */
let registered: Set<string> = new Set()

/**
 * Asks whether a setting puts its rule's check off until the end of the plugin's run.
 *
 * A primary of `-single-line` or `-multi-line` conditions the rule on a lineness another rule of the same run may be about to change: asked at the rule's own turn, the question is answered of a text that is about to stop being what it was, and the order the configuration lists the two rules in decides both the file and whether the rule speaks at all (#355). Deferred to the run's end, the question is asked of the text every writer has finished.
 * @param primary - The primary option the rule is configured with.
 * @returns True where the check is to wait for the writers.
 */
export function defersToRunEnd (primary: unknown): boolean {
	return typeof primary === `string` && LINENESS_PRIMARY.test(primary)
}

/**
 * Files one rule name as built by the plugin, so that the last rule of a configuration can be told from a name the plugin never built.
 * @param ruleName - The name a configuration refers to the rule by.
 */
export function registerPluginRule (ruleName: string): void {
	registered.add(ruleName)
}

/**
 * Reads whether a setting enables its rule, the way Stylelint's own runner reads it: a setting of `null`, or one whose primary is `null`, is a rule turned off, and its check is never called.
 * @param setting - The setting under the rule's name in a normalised configuration.
 * @returns True where the rule runs.
 */
function enables (setting: unknown): boolean {
	return setting !== null && !(Array.isArray(setting) && setting[0] === null)
}

/**
 * Names the last rule of the plugin this run calls.
 *
 * Stylelint calls the rules of a run in the order the configuration lists them — its sort puts every plugin rule in front of its own, and is stable — and skips the ones turned off or never built, so the last name here is the last call the plugin gets, and the place the deferred checks are flushed at.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The name, or nothing where the configuration lists no rule of the plugin.
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
 * Puts one check off until the run's writers have written into this root.
 * @param root - The root the check was called with, whose flush the check waits for.
 * @param rank - The place the check takes among the others put off with it, from `linenessRank`.
 * @param run - The check, closed over everything its rule was called with.
 */
export function deferCheck (root: Document | Root, rank: string, run: () => void): void {
	queuesOf(root).lineness.push({ rank, run })
}

/**
 * Puts one check off until everything else of the run has written into this root — the lineness-conditioned checks included, since those write breaks of their own (#353).
 * @param root - The root the check was called with, whose flush the check waits for.
 * @param rank - The place the check takes among the others put off with it, from `linenessRank`.
 * @param run - The check, closed over everything its rule was called with.
 */
export function deferFinalCheck (root: Document | Root, rank: string, run: () => void): void {
	queuesOf(root).reading.push({ rank, run })
}

/**
 * Runs the checks put off for this root: the lineness-conditioned tier first, then the tier that reads every line — each in the plugin's own order rather than the configuration's (#502).
 *
 * Both tiers are sorted, since either can hold two checks of one rule: every namespace of the plugin reads a plain CSS file, so a configuration listing `@stylistic/x` beside `@stylistic/scss/x` has the root read by both, and the reading tier holds `indentation` under as many namespaces as are configured. The place carries the namespace behind the rule's name, so no two checks of one run share one, and what the sort's stability then keeps the configuration's order for is nothing.
 * @param root - The root whose checks are due.
 */
export function flushDeferredChecks (root: Document | Root): void {
	let queues = deferred.get(root)

	if (!queues) return

	deferred.delete(root)

	for (let { run } of queues.lineness.toSorted(byRank)) run()
	for (let { run } of queues.reading.toSorted(byRank)) run()
}
