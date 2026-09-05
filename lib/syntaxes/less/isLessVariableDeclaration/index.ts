import type { AtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

/**
 * Asks whether a node the parser handed over as an at-rule is a Less variable declaration — `@v: pink`, or `@dr: { … }`, which declares a detached ruleset.
 *
 * `postcss-less` marks such a node `variable` only where the colon lands in `raws.afterName`, which is where the name the tokenizer read ends in the colon. Whitespace between the name and the colon ends the name in front of it, and the colon opens the parameters instead; a name spelled onto its value with no whitespace on either side, `@v:pink 1px`, keeps the colon in the name. `less@4.9.1` declares the variable `@v` on every one of those spellings alike, so the mark is read first and the shape stands in for it where the mark is missing.
 *
 * A node carrying a block is a detached ruleset where its parameters are the colon and nothing else, `@dr : { … }`; anything behind that colon makes it an at-rule to Less, which prints `@page :first { … }` and `@v : red { … }` back as they stand, and a name holding the colon in front of a block is an at-rule too — `@v:pink { … }` declares no `@v`. A node carrying none is a variable declaration where its parameters open on the colon or its name holds one: `@v : pink`, `@v :pink`, `@v:pink 1px`, `@page:first;`, and `@import : "x"` and `@custom-selector :--h h1`, both of which Less reads as variables named for the at-rule and prints nothing of.
 *
 * Whether Less reads a variable there is decided by whether the text behind the colon parses as an expression of its own, and where it does not, Less falls back to reading a directive: `@custom-media :x (min-width: 1px);` and `@x :a (b: 1px);` are printed back as at-rules, while `@x :a (b);` is the variable `a b`. That grammar is not this plugin's to carry, so the shape answers those as variables too, and a rule passes such a node over rather than reading it — the side every guard of this namespace errs on, since a fix written over a variable's name leaves a file Less refuses, and a node passed over costs a warning at most.
 * @param atRule - The at-rule node to read.
 * @returns True where Less reads a variable declaration in the node.
 */
export function isLessVariableDeclaration (atRule: AtRule | LessAtRule): boolean {
	if (`variable` in atRule && atRule.variable) return true

	if (`mixin` in atRule && atRule.mixin) return false

	if (atRule.nodes) return atRule.params === `:`

	return atRule.params.startsWith(`:`) || atRule.name.includes(`:`)
}
