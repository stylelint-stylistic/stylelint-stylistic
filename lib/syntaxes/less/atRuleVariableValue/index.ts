import type { AtRule } from "postcss"

import { printedText, writePrintedText } from "../../../preprocessor/printedText/index.ts"
import type { Edit } from "../../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../../utils/atRuleParamIndex/index.ts"
import type { AtRuleVariableValue } from "../../index.ts"
import { syncLessVariableValue } from "../syncLessVariableValue/index.ts"

/**
 * Finds the value of a Less variable declaration in the copies `postcss-less` split it over.
 *
 * The parser marks the node `variable` only where the colon closed the name, and leaves the colon at the head of the params where the name ended in front of it; both keep the whole value in the params. Where the at-word ran on past the colon, the word behind it is welded into the name — `@v:10PX 1px` comes back named `v:10PX` with `1px` for params, `@v:url(10PX)` named `v:url` with the nameless group `(10PX)` — so the value is gathered from the name, the raw behind it and the params, which is contiguous in the printed node ([#649](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/649)).
 *
 * A block shuts the two unmarked readings: `@page:first { … }` spells a colon in its name and is an at-rule of CSS. A marked node with a block is a detached ruleset, whose params hold whatever stands in front of the brace, and is read as it always was.
 * @param atRule - The at-rule.
 * @returns The value, or `null` where Less declares no variable with this at-rule.
 */
export function atRuleVariableValue (atRule: AtRule): AtRuleVariableValue | null {
	let marked = `variable` in atRule && Boolean(atRule.variable)

	if (marked || (!atRule.nodes && atRule.params.startsWith(`:`))) {
		return {
			text: printedText(atRule),
			index: atRuleParamIndex(atRule),
			write (fixed: string): void {
				writePrintedText(atRule, fixed)
				syncLessVariableValue(atRule, fixed)
			},
		}
	}

	let colon = atRule.name.indexOf(`:`)

	if (atRule.nodes || colon === -1) return null

	let head = atRule.name.slice(colon + 1)
	let between = atRule.raws.afterName ?? ``

	return {
		// 1 for the `@`, and one more for the colon the name keeps
		index: colon + 2,
		text: head + between + printedText(atRule),
		write (fixed: string, edits: Edit[]): void {
			// Where the head ends in the fixed text, since recasing a run does not always keep its length: `ß` uppercases to `SS`. No edit spans the raw between the two, which is whitespace and comments
			let headEnd = edits.filter((edit) => edit.end <= head.length).reduce((end, edit) => end + edit.text.length - (edit.end - edit.start), head.length)

			atRule.name = atRule.name.slice(0, colon + 1) + fixed.slice(0, headEnd)
			writePrintedText(atRule, fixed.slice(headEnd + between.length))
		},
	}
}
