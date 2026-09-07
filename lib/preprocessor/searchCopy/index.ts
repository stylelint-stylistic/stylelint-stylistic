import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { blankComments } from "../../utils/blankComments/index.ts"
import { type CommentSpan, findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { hideFalseInlineComments } from "../../utils/hideFalseInlineComments/index.ts"
import { readsInlineComments } from "../readsInlineComments/index.ts"

/**
 * Builds the copy of a node's text a scan is handed in place of the text, and returns the comments it was built from.
 *
 * `style-search` reads comments by rules of its own: a `//` comment ends on a line feed only, a `//` opens one anywhere, and the `*\/` closing one block comment against the `/*` opening the next spell a third. The copy blanks every comment and masks every false `//`, at the same length, so every position holds. The syntax says which `//` is a comment, since the pair in `myurl(//a)` is code in plain CSS.
 * @param text - The value or parameters the search runs over.
 * @param node - The node the text was read from.
 * @param result - The Stylelint result.
 * @returns The copy, and the comment spans of the text.
 */
export function searchCopy (text: string, node: Node, result: PostcssResult): {
	searchString: string,
	commentSpans: CommentSpan[],
} {
	let commentSpans = findCommentSpans(text, readsInlineComments(node, result))

	// No spans for the masking: every comment is gone from the copy, so every `//` left in it opens none
	return {
		searchString: hideFalseInlineComments(blankComments(text, commentSpans), []),
		commentSpans,
	}
}
