import type { AtRule as PostcssAtRule } from "postcss"
import type { AtRule as LessAtRule } from "postcss-less"

import { printedText } from "../../../preprocessor/printedText/index.ts"
import { findCommentSpans } from "../../../utils/findCommentSpans/index.ts"

export type AtRule = PostcssAtRule | LessAtRule

/**
 * Takes the comments out of a text.
 * @param text - The text.
 * @returns The text without them.
 */
function withoutComments (text: string): string {
	let kept = ``
	let index = 0

	for (let span of findCommentSpans(text)) {
		kept += text.slice(index, span.start)
		index = span.end
	}

	return kept + text.slice(index)
}

/**
 * Reads the head of a variable's printed params: the text in front of the value, the head of the comment-free copy with every comment the printed text holds among its characters, those behind its last character aside.
 * @param printed - The params as printed, comments and all.
 * @param clean - The same text without its comments.
 * @param headLength - The length of the head in the comment-free copy.
 * @returns The printed head, or an empty text where the two do not agree.
 */
function printedHead (printed: string, clean: string, headLength: number): string {
	let comments = new Map(findCommentSpans(printed).map((span) => [span.start, span.end]))
	let index = 0
	let matched = 0

	while (matched < headLength && index < printed.length) {
		let commentEnd = comments.get(index)

		if (commentEnd !== undefined) index = commentEnd
		else if (printed[index] === clean[matched]) {
			index += 1
			matched += 1
		}
		else return ``
	}

	return matched === headLength ? printed.slice(0, index) : ``
}

/**
 * Mirrors the text about to be written to an at-rule's params into `value`: a Less variable carries both, and the stringifier prints `raws.afterName` and `value` alone.
 *
 * Where the value opens with a colon of its own, `@v: : 10PX`, `postcss-less` keeps that colon in `raws.afterName` and at the head of the params but not in `value`, so the head the params hold in front of the value is left out of the mirror, or every fix prints it once more. The head is read with the comments taken out of both copies, since the parser leaves them out of `value` and a write earlier in the pass puts them in, and is cut out of the printed params past the comments among its characters. Asked before the params are written, since the head is read off the copies as they stand.
 * @param atRule - The at-rule.
 * @param params - The text about to be written to its params.
 * @returns The at-rule.
 */
export function syncLessVariableValue (atRule: AtRule, params: string): AtRule {
	if (!(`variable` in atRule && atRule.variable)) return atRule

	let printed = printedText(atRule)
	let clean = withoutComments(printed)
	let value = withoutComments(typeof atRule.value === `string` ? atRule.value : ``)
	let head = clean.endsWith(value) ? printedHead(printed, clean, clean.length - value.length) : ``

	atRule.value = params.startsWith(head) ? params.slice(head.length) : params

	return atRule
}
