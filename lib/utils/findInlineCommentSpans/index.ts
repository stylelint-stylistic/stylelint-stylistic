import { type CommentReading, findCommentSpans } from "../findCommentSpans/index.ts"

/** An inline comment's span in a value, in the file's coordinates. */
export type InlineCommentSpan = {
	start: number,
	end: number,
}

/**
 * Finds the spans of a string's inline comments: {@link findCommentSpans} without the block ones, as {@link rewriteInlineComments} spells them. A rule asking whether a value node stands in a comment asks {@link findCommentSpanHolding} instead, since the value parser closes a block comment early ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)).
 * @param text - The string.
 * @param reading - What the node's syntax makes of a `//` comment.
 * @returns The spans, in the string's coordinates.
 */
export function findInlineCommentSpans (text: string, reading?: CommentReading): InlineCommentSpan[] {
	return findCommentSpans(text, reading)
		.filter(({ isInline }) => isInline)
		.map(({ start, end }) => ({ start, end }))
}
