import type { Document, Root } from "postcss"
import type { PostcssResult } from "stylelint"

/** The primaries that condition a rule on a text standing on one line or over several. A rule configured with one reads a lineness another rule of the same run may be about to change, which is what the deferral below exists for (#355). */
const LINENESS_PRIMARY = /-(?:single|multi)-line$/u

/** The checks put off until the run's writers have written, by the root they were called with. A document's roots are each walked by every rule in turn, so each root's checks live and are flushed on their own. */
let deferred: WeakMap<Document | Root, (() => void)[]> = new WeakMap()

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
 * @param run - The check, closed over everything its rule was called with.
 */
export function deferCheck (root: Document | Root, run: () => void): void {
	let queue = deferred.get(root)

	if (queue) {
		queue.push(run)

		return
	}

	deferred.set(root, [run])
}

/**
 * Runs the checks put off for this root, in the order the configuration lists their rules.
 * @param root - The root whose checks are due.
 */
export function flushDeferredChecks (root: Document | Root): void {
	let queue = deferred.get(root)

	if (!queue) return

	deferred.delete(root)

	for (let run of queue) run()
}
