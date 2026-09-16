import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { type CommentReading, findCommentSpans } from "../findCommentSpans/index.ts"

/**
 * Asks whether every comment an edited text holds stood in the text before the edits, moved by what they wrote in front of it: a write may take a comment's reading away, but not open one or change where one runs.
 *
 * Whitespace taken away behind `url(` in front of a quotation mark makes `postcss-scss` read the parentheses as code rather than as one token, which reads no comment: `url( 'a' \// c)` holds none, `url('a' \// c)` a `//` comment swallowing the `)`, while Sass reads `\/` as an escape in both.
 * @param text - The text the edits apply to.
 * @param edits - The edits, indexed in that text, no two overlapping.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns True where each comment of the edited text stood, so moved, in the text.
 */
export function editsOpenNoComment (text: string, edits: Edit[], reading: CommentReading): boolean {
	let standing = findCommentSpans(text, reading).map(({ start, end }) => {
		let shift = edits.filter((edit) => edit.end <= start).reduce((sum, edit) => sum + edit.text.length - (edit.end - edit.start), 0)

		return { start: start + shift, end: end + shift }
	})

	return findCommentSpans(applyEditsFromEnd(text, edits), reading).every((span) => standing.some((other) => other.start === span.start && other.end === span.end))
}
