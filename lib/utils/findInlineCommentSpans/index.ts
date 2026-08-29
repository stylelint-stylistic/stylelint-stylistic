import { findCommentSpans } from "../findCommentSpans/index.ts"

/** The span an inline comment occupies in a value, in the coordinates of the file, and how far the copy a syntax rewrote its comments in has run away from that value by the end of the comment. */
type InlineCommentSpan = { start: number, end: number, delta?: number }

/**
 * Finds the spans the inline comments of a string occupy in it. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does one inside a block comment; a comment ends with its line rather than with the string.
 * @param text - The string to scan.
 * @param spellsInlineComments - False where the syntax that spelled the string writes no comment with a double slash, which {@link readsInlineComments} answers for a node.
 * @returns The spans, in the coordinates of the scanned string.
 */
export function findInlineCommentSpans (text: string, spellsInlineComments: boolean = true): InlineCommentSpan[] {
	return findCommentSpans(text, spellsInlineComments)
		.filter(({ isInline }) => isInline)
		.map(({ start, end }) => ({ start, end }))
}

/**
 * Finds the span of the inline comment holding a position of a text, where one holds it.
 *
 * The position is one of the text the spans were found in, whatever a caller reads there — the opening of a node, which {@link findInlineCommentSpanHolding} asks about, or a character the parser put a meaning on, such as the parenthesis a call was closed on.
 * @param index - The position, counted in the text the spans were found in.
 * @param spans - The spans {@link findInlineCommentSpans} found in that text.
 * @returns The span holding the position, or nothing where no comment does.
 */
export function findInlineCommentSpanAt (index: number, spans: InlineCommentSpan[]): InlineCommentSpan | undefined {
	return spans.find(({ start, end }) => index >= start && index < end)
}

/**
 * Finds the span of the inline comment holding a node of a value parse, where one holds it.
 *
 * `postcss-value-parser` has a node for a block comment and none for a comment opened by a double slash, so a block comment reaches a rule as a node of its own and is passed over, while the text of an inline one reaches it as ordinary words, functions and divs. A rule walking that parse works on the text of the comment as it works on the value, reporting about it and writing into it, unless it asks this (#271).
 *
 * The question is put to the position the node opens at, and says nothing about where the node ends. A node opening inside a comment is a node of that comment's text however far it reaches: a call opened there and closed on the line below is handed back whole, and what the parser made of it is a reading of a comment rather than anything the file spells. A node opening outside one is a node of the value however far it reaches, and a call is the one that reaches far — whether the parser closed it on a parenthesis standing inside a comment is a second question, put to that parenthesis through {@link findInlineCommentSpanAt} and answered the same way (#320).
 *
 * A caller therefore refuses the node and goes on walking what it holds, asking the same of each: a node standing on the line below the comment is code the file spells, wherever the parser filed it.
 * @param valueNode - The node the walk has reached.
 * @param spans - The spans {@link findInlineCommentSpans} found in the text the node was parsed from, which the node's positions count in.
 * @returns The span holding the node, or nothing where the node is one of the value.
 */
export function findInlineCommentSpanHolding (valueNode: import("postcss-value-parser").Node, spans: InlineCommentSpan[]): InlineCommentSpan | undefined {
	return findInlineCommentSpanAt(valueNode.sourceIndex, spans)
}

/**
 * Finds the span of an inline comment whose text a node of a value parse carries any of, where one does.
 *
 * This is the question a caller writing a node back has to put, and it is not the one {@link findInlineCommentSpanHolding} answers. That one says what a node *is* — a node of the comment's text or a node of the value — and is put to the position the node opens at alone. A node opening outside a comment and reaching past its opening is a node of the value all the same, and yet the text it carries holds the comment, so writing it back by any means other than the file's own characters rewrites that comment.
 *
 * A call is the node that reaches: `postcss-value-parser` closes one on a parenthesis wherever it finds one, the text of a comment included, so `f( // c` and a closing parenthesis on the line below is one call carrying a whole comment inside it.
 * @param valueNode - The node about to be written back, of which only its span is read.
 * @param spans - The spans {@link findInlineCommentSpans} found in the text the node was parsed from, which the node's positions count in.
 * @returns The span the node overlaps, or nothing where the node carries no comment's text.
 */
export function findInlineCommentSpanTouching (valueNode: Pick<import("postcss-value-parser").Node, `sourceIndex` | `sourceEndIndex`>, spans: InlineCommentSpan[]): InlineCommentSpan | undefined {
	return spans.find(({ start, end }) => valueNode.sourceIndex < end && valueNode.sourceEndIndex > start)
}

export type { InlineCommentSpan }
