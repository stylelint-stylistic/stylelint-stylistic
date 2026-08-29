import { LEADING_NON_WHITESPACE, TRAILING_SPACES } from "../../regexps.ts"
import { findCommentSpans } from "../findCommentSpans/index.ts"

export type CommentSpan = import("../findCommentSpans/index.ts").CommentSpan

/** The run a comment takes out of a text when it is removed from it, from the first character taken to the one behind the last. */
export type RemovedRun = { start: number, end: number }

/**
 * Says which runs of a text its comments take with them when they are removed.
 *
 * A comment followed by whitespace, or by nothing at all, goes and takes the spaces in front of it with it: the two runs of whitespace around it would otherwise become one run twice as wide as either, and `f(1px, /*c*\/ 2px)` would be read as holding two spaces behind its comma. Spaces and nothing else, since a rule reading the copy is asking after the whitespace a file spells: a tab in front of the comment stays where it is, so that `f(1px,\t/*c*\/ 2px)` still answers for the tab standing behind its comma, and a line break stays too, being a break of the code rather than of the comment's own.
 *
 * A comment code follows straight away stays where it is, whole. Taking it out would leave the whitespace in front of it standing against that code — `f(1 /*c*\/, 1)` would be read as `f(1 , 1)` and reported for a space that is not there, and the fix that followed would take a space away from the far side of the comment.
 * @param text - The text to read.
 * @param spans - The spans its comments occupy in it, where they are already known.
 * @returns The runs, in the coordinates of the given text, in the order they stand in it.
 */
function commentRemovalRuns (text: string, spans: CommentSpan[] = findCommentSpans(text)): RemovedRun[] {
	let runs: RemovedRun[] = []

	for (let { start, end } of spans) {
		if (LEADING_NON_WHITESPACE.test(text.slice(end))) continue

		// The run may be empty, so the pattern matches every text
		let leading = (text.slice(0, start).match(TRAILING_SPACES) as RegExpMatchArray)

		runs.push({ start: start - leading[0].length, end })
	}

	return runs
}

/**
 * Takes the comments out of a text, each with whatever it carries off, so that a rule measuring the whitespace of the text does not measure a comment's own.
 *
 * `functionCommaSpaceChecker` read the same text with a regular expression until [#214](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/214). That expression carried no `g` flag, so only the first comment of a text was ever taken out, and its block-comment branch backtracked: where the `*\/` of one comment was followed by code, the match grew until it found a `*\/` that was followed by whitespace, swallowing everything in between — a comma of the arguments among it. A comment is found by reading the text here, which knows a string from code and cannot be lured across anything.
 * @param text - The text to take the comments out of.
 * @param spans - The spans its comments occupy in it, where they are already known.
 * @returns The text, with every comment and whatever it carries off taken out.
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
 * Counts the characters the comments of a text take out of the run standing in front of an index, so that a position measured in the text can be measured in the copy the comments were taken out of.
 * @param text - The text the index counts in.
 * @param index - The index in that text.
 * @param spans - The spans its comments occupy in it, where they are already known.
 * @returns The number of characters taken out in front of the index.
 */
export function commentsRemovedBefore (text: string, index: number, spans: CommentSpan[] = findCommentSpans(text)): number {
	let removed = 0

	for (let { start, end } of commentRemovalRuns(text, spans)) {
		if (start >= index) break

		removed += Math.min(end, index) - start
	}

	return removed
}
