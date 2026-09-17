import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { blankComments } from "../../utils/blankComments/index.ts"
import { type CommentSpan, findCommentSpans, findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { hideFalseInlineComments } from "../../utils/hideFalseInlineComments/index.ts"
import { maskEscapes } from "../../utils/maskEscapes/index.ts"
import { maskStrings } from "../../utils/maskStrings/index.ts"
import { inlineCommentReading } from "../readsInlineComments/index.ts"

/**
 * Builds the copy of a node's text a scan is handed in place of the text, and returns the comments it was built from.
 *
 * `style-search` reads comments, strings and escapes by rules of its own: a `//` comment ends on a line feed only, a `//` opens one anywhere, the `*\/` closing one block comment against the `/*` opening the next spell a third, and a backslash covers nothing, so the `,` of `a\,b` is a comma to it; its reading of a string is {@link maskStrings}'s question. The copy blanks every comment, masks every string, every escape ({@link maskEscapes}) and every false `//`, at the same length, so every position holds. The syntax says which `//` is a comment, since the pair in `myurl(//a)` is code in plain CSS.
 * @param text - The value or parameters the search runs over.
 * @param node - The node the text was read from.
 * @param result - The Stylelint result.
 * @returns The copy, and the comment spans of the text.
 */
export function searchCopy (text: string, node: Node, result: PostcssResult): {
	searchString: string,
	commentSpans: CommentSpan[],
} {
	let reading = inlineCommentReading(node, result)
	let commentSpans = findCommentSpans(text, reading)

	// No spans for the masking: every comment is gone from the copy, so every `//` left in it opens none
	return {
		searchString: hideFalseInlineComments(maskStrings(maskEscapes(blankComments(text, commentSpans), findEscapeSpans(text, reading)), []), []),
		commentSpans,
	}
}
