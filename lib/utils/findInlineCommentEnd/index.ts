import { INLINE_COMMENT_BREAK, INLINE_COMMENT_BREAK_OR_FORM_FEED } from "../../regexps.ts"
import type { CommentReading } from "../findCommentSpans/index.ts"

/**
 * Finds the break closing a `//` comment: {@link INLINE_COMMENT_BREAK}, the `\r` of a Windows pair included. A form feed goes with them where the syntax closes a comment on one, which is Sass's reading and not Less's.
 * @param text - The text the comment opened in.
 * @param openIndex - Where the comment opens.
 * @param reading - What the syntax makes of a `//` comment; a form feed is the comment's text unless it says otherwise.
 * @returns The break, or the text's length.
 */
export function findInlineCommentEnd (text: string, openIndex: number, reading?: CommentReading): number {
	let index = text.slice(openIndex).search(reading?.endsOnFormFeed ? INLINE_COMMENT_BREAK_OR_FORM_FEED : INLINE_COMMENT_BREAK)

	return index === -1 ? text.length : openIndex + index
}
