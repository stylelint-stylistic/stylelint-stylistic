import type { AtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

/**
 * Asks whether an at-rule is a call to a Less detached ruleset, `@dr()`.
 *
 * `postcss-less` leaves no mark on such a call, so it is told by shape: no block, an empty `raws.afterName` and params opening on `()`. A space in front of the parentheses ends the call, since Less reads `@dr ()` as an at-rule; what follows them does not, since Less inlines `@dr()[key]` like `@dr()`. The opening parenthesis alone would match every at-rule spelled without a space in front of its options, `@supports(a: b)` among them. Read literally, the two characters err on `@dr( )[key]`, a call Less accepts and this reads as an at-rule, and on shapes Less refuses, `@whatever() x`.
 *
 * A mixin call carries the same empty argument list, so its mark is read first. The shape is the parser's, not the language's: every syntax spells `@dr()` the same way, so the caller decides whether the answer means anything.
 * @param atRule - The at-rule.
 * @returns True where the node is a call to a detached ruleset.
 */
export function isLessDetachedRulesetCall (atRule: AtRule | LessAtRule): boolean {
	if (`mixin` in atRule && atRule.mixin) return false

	return !atRule.nodes && atRule.raws.afterName === `` && atRule.params.startsWith(`()`)
}
