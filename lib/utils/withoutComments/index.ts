import { LEADING_NON_WHITESPACE, TRAILING_SPACES } from "../../regexps.ts"
import { type CommentSpan, findCommentSpans } from "../findCommentSpans/index.ts"

/** The run a comment takes out of a text when removed. */
export type RemovedRun = {
	start: number,
	end: number,
}

/**
 * Says which runs a text's comments take with them when removed.
 *
 * A comment followed by whitespace or nothing takes the spaces in front of it, or `f(1px, /*c*\/ 2px)` would read as two spaces behind its comma; spaces only, since a tab or a break there belongs to the code. One followed by code stays whole, or `f(1 /*c*\/, 1)` would read as `f(1 , 1)`.
 * @param text - The text the comments stand in.
 * @param spans - Its comment spans, where known.
 * @returns The runs, in order.
 */
function commentRemovalRuns (text: string, spans: CommentSpan[] = findCommentSpans(text)): RemovedRun[] {
	let runs: RemovedRun[] = []

	for (let { start, end } of spans) {
		if (LEADING_NON_WHITESPACE.test(text.slice(end))) continue

		// The run may be empty, so the pattern matches every text
		let leading = text.slice(0, start).match(TRAILING_SPACES) as RegExpMatchArray

		runs.push({ start: start - leading[0].length, end })
	}

	return runs
}

/**
 * Takes the comments out of a text, each with what it carries off, so a rule does not measure a comment's whitespace.
 *
 * Until [#214](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214) a regular expression backtracked past a `*\/` followed by code and swallowed a comma.
 * @param text - The text the comments are taken out of.
 * @param spans - Its comment spans, where known.
 * @returns The text without them.
 */
export function withoutComments (text: string, spans: CommentSpan[] = findCommentSpans(text)): string {
	let kept = ``
	let index = 0

	for (let { start, end } of commentRemovalRuns(text, spans)) {
		kept += text.slice(index, start)
		index = end
	}

	return `${kept}${text.slice(index)}`
}

/**
 * Counts the characters the comments take out in front of an index.
 * @param text - The text the comments stand in.
 * @param index - The index in it.
 * @param spans - Its comment spans, where known.
 * @returns The count.
 */
export function commentsRemovedBefore (text: string, index: number, spans: CommentSpan[] = findCommentSpans(text)): number {
	let removed = 0

	for (let { start, end } of commentRemovalRuns(text, spans)) {
		if (start >= index) break

		removed += Math.min(end, index) - start
	}

	return removed
}
