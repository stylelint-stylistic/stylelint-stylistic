import type { Comment } from "postcss"

import { isInlineComment } from "../../../preprocessor/isInlineComment/index.ts"
import { INLINE_COMMENT_BREAK, WHITESPACE_OR_NOTHING } from "../../../regexps.ts"
import { blankComments } from "../../../utils/blankComments/index.ts"

/**
 * Reads the code a `//` comment node holds, in a copy of its `raws.left` and text as long as the two.
 *
 * `postcss-less` ends such a comment in a block on a line feed, and Less on a bare carriage return too, so what follows one is code the parser kept in the node. A break with nothing but whitespace in front of it lands in `raws.left`. The copy blanks everything up to the first break and every comment behind it, which runs to the next break as Less reads one.
 * @param comment - The comment node.
 * @returns The copy, or null where the comment holds nothing but whitespace and comments behind a break.
 */
export function inlineCommentCode (comment: Comment): string | null {
	if (!isInlineComment(comment)) return null

	let content = `${comment.raws.left ?? ``}${comment.text}`
	let index = content.search(INLINE_COMMENT_BREAK)

	if (index === -1) return null

	let code = ` `.repeat(index) + blankComments(content.slice(index))

	return WHITESPACE_OR_NOTHING.test(code) ? null : code
}
