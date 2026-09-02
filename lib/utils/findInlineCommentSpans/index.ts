import { findCommentSpans } from "../findCommentSpans/index.ts"

/** The span an inline comment occupies in a value, in the coordinates of the file. */
export type InlineCommentSpan = {
	start: number,
	end: number,
}

/**
 * Finds the spans the inline comments of a string occupy in it. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does one inside a block comment; a comment ends with its line rather than with the string.
 *
 * This is {@link findCommentSpans} with the block comments taken out, and it answers one question: which comments `postcss-scss` rewrites when it fills the raw of a text, which is what {@link rewriteInlineComments} spells the way that syntax does. A rule asking whether a node of a value stands in a comment asks about every comment the file spells instead, through {@link findCommentSpanHolding}: a block comment the value parser closes early hands the rest of its text back as nodes of the value, and a list holding the inline comments alone says nothing about it (#378).
 * @param text - The string to scan.
 * @param spellsInlineComments - False where the syntax that spelled the string writes no comment with a double slash, which {@link readsInlineComments} answers for a node.
 * @returns The spans, in the coordinates of the scanned string.
 */
export function findInlineCommentSpans (text: string, spellsInlineComments: boolean = true): InlineCommentSpan[] {
	return findCommentSpans(text, spellsInlineComments)
		.filter(({ isInline }) => isInline)
		.map(({ start, end }) => ({ start, end }))
}
