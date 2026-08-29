import type { AtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

/**
 * Asks whether a node the parser handed over as an at-rule is a call to a Less detached ruleset — `@dr()`, where `@dr: { … }` stands somewhere above.
 *
 * `postcss-less` leaves no mark on such a call, so it is told by the shape of the node: no block, nothing in `raws.afterName`, and parameters opening on the two characters `()`. A space in front of those parentheses ends the call — `less@4.9.0` inlines the ruleset behind `@dr()` and prints `@dr ()` back as an at-rule of its own, answering `@dr rule is missing block or ending semi-colon` where no semicolon closes it. What follows them does not end it: Less inlines `@dr()[key]` exactly as it inlines `@dr()`, so the parameters are read from their front rather than whole.
 *
 * Reading the opening parenthesis alone instead calls every at-rule spelled without a space in front of its options a call: `@import(reference) "x"`, `@supports(a: b)`, `@layer(l)`, `@plugin(args) "p"` and `@whatever(x)` all come back with an empty `raws.afterName` and parameters opening with one, and Less compiles all five.
 *
 * The two characters are read literally, so this errs in both directions on shapes no compiler accepts either way. `@dr( )[key]` is a call to Less and is answered as an at-rule, since the parentheses are not the bare pair; and an at-rule spelling `()` and then something else — `@whatever() x`, `@supports() and (a: b)` — is answered as a call. Over 874 spellings put through `less@4.9.0`, every form on either side of that line is `Unrecognised input` to it apart from the whitespace-in-parentheses call, whose only cost is a semicolon left standing and a node passed over.
 *
 * A mixin call carries the same empty argument list and is no detached ruleset, so its mark is read here first, ahead of the shape. Both callers ask about that mark before they call this, so the mark answers twice over rather than once — and the name of this stays true on its own.
 *
 * The shape is the parser's and not the language's: PostCSS itself, `postcss-scss` and every syntax built on them spell `@dr()` exactly the same way, so what is read here is asked of every stylesheet rather than of Less alone. Whether the answer means anything is the caller's to decide.
 * @param atRule - The at-rule node to read.
 * @returns True where the node is a call to a detached ruleset.
 */
export function isLessDetachedRulesetCall (atRule: AtRule | LessAtRule): boolean {
	if (`mixin` in atRule && atRule.mixin) return false

	return !atRule.nodes && atRule.raws.afterName === `` && atRule.params.startsWith(`()`)
}
