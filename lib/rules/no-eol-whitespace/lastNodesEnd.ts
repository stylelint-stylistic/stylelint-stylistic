import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { LINE_BREAK, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { trailingSemicolonAsked } from "../../utils/closedBySemicolon/index.ts"
import { declarationEndsTheStylesheet } from "../../utils/declarationEndsTheStylesheet/index.ts"
import type { NeighborRule } from "../../utils/neighborSettings/index.ts"
import { runHeldForTheBlock } from "../../utils/runHeldForTheBlock/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { type Whitespace, whitespaceAsked } from "../../utils/whitespaceAsked/index.ts"

import { isEscaped } from "./escapes.ts"

/** The rules writing the run behind a declaration's colon, which a value of whitespace alone is. */
const RULES_BEHIND_THE_COLON: Record<Whitespace, NeighborRule> = {
	newline: {
		name: `declaration-colon-newline-after`,
		options: [`always`, `always-multi-line`],
	},
	space: {
		name: `declaration-colon-space-after`,
		options: [`always`, `never`, `always-single-line`],
	},
}

/**
 * Trims the spaces and tabs a text ends on, but for one a backslash escapes, which is a character of the word in front of it.
 * @param text - The text.
 * @param readsEscapes - Whether the text holds its backslashes as the stylesheet reads them.
 * @returns The trimmed text.
 */
function trimTheEnd (text: string, readsEscapes: boolean): string {
	let trimmed = text.replace(TRAILING_SPACES_AND_TABS, ``)

	return readsEscapes && trimmed.length < text.length && isEscaped(text, trimmed.length, 0) ? text.slice(0, trimmed.length + 1) : trimmed
}

/**
 * Trims the spaces and tabs a root's text ends on where they stand in its last node rather than in its tail: a custom property keeps the whitespace behind its value in the value, and behind its `!important` in the flag's raw. With no semicolon behind the node they end its line where the tail is empty, as the check reads them at the text's end where that end ends a line, or opens with a break, which a neighbor such as `no-missing-end-of-source-newline` may have written there in the same run. Where `declaration-block-trailing-semicolon` will write a semicolon behind the node, as it does in an inline `style` attribute, they are read where it leaves them, whichever of the two rules runs first: in front of the semicolon where the value keeps them, and left; handed to the tail behind it otherwise ({@link runHeldForTheBlock}), and trimmed.
 * @param syntax - The syntax the rule is built over, which reads and writes the value.
 * @param root - The root.
 * @param result - The Stylelint result, which holds the configuration.
 */
export function trimTheLastNodesEnd (syntax: Syntax, root: Root, result: PostcssResult): void {
	let { last } = root

	if (!last || !isDeclaration(last) || root.raws.semicolon || (root.raws.after && !OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(root.raws.after)) || (trailingSemicolonAsked(last, result) && runHeldForTheBlock(syntax, last, result) === ``)) return

	let readsEscapes = syntax.readsBackslashesAsWritten(root)

	if (typeof last.raws.important === `string`) {
		last.raws.important = trimTheEnd(last.raws.important, readsEscapes)

		return
	}

	let value = syntax.read(last)
	let trimmed = trimTheEnd(value, readsEscapes)

	// A value of nothing but that whitespace is the run behind the colon, which the colon's rules write where they read it; written here as they ask, so the order of the rules does not decide the file. Where no break stands behind the colon yet, `declaration-colon-newline-after` breaks it; `declaration-colon-space-after` passes over a run ending a file, though not one ending an inline `style` attribute
	if (trimmed === `` && value !== `` && !LINE_BREAK.test(last.raws.between ?? ``)) trimmed = whitespaceAsked(last, result, declarationEndsTheStylesheet(last) ? { newline: RULES_BEHIND_THE_COLON.newline } : RULES_BEHIND_THE_COLON, () => true)

	if (trimmed !== value) syntax.write(last, trimmed)
}
