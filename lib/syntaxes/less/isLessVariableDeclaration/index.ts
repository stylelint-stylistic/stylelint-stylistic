import type { AtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

/**
 * Asks whether a node the parser returned as an at-rule is a Less variable declaration, `@v: pink`, or a detached ruleset, `@dr: { … }`.
 *
 * `postcss-less` marks a node `variable` only where the colon lands in `raws.afterName`: whitespace ends the name in front of the colon, and `@v:pink 1px` keeps the colon in the name. Less declares `@v` on every spelling, so the mark is read first and the shape stands in where it is missing.
 *
 * With a block, a detached ruleset is one whose parameters are the colon alone, `@dr : { … }`; `@page :first { … }` is an at-rule. Without one, a variable is a node whose parameters open on the colon or whose name holds one: `@v : pink`, `@v:pink 1px`, `@page:first;`. Where the text behind the colon parses as no expression Less falls back to a directive, `@custom-media :x (min-width: 1px);`; that grammar is not the plugin's to carry, so the shape answers those as variables too and a rule passes them over, the side every guard here errs on: a fix over a variable's name leaves a file Less refuses.
 * @param atRule - The at-rule.
 * @returns True where Less reads a variable declaration.
 */
export function isLessVariableDeclaration (atRule: AtRule | LessAtRule): boolean {
	if (`variable` in atRule && atRule.variable) return true

	if (`mixin` in atRule && atRule.mixin) return false

	if (atRule.nodes) return atRule.params === `:`

	return atRule.params.startsWith(`:`) || atRule.name.includes(`:`)
}
