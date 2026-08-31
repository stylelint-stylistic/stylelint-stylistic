import type { Comment } from "postcss"

/**
 * Asks whether the syntax has read a comment as one opened by a double slash. `postcss-less` marks such a node with `inline` and `postcss-scss` with `raws.inline`, and either mark is the syntax's own word for it, so the one question is asked here for the probe, the guards and the writer alike.
 * @param comment - The comment node.
 * @returns True where the syntax marked it an inline comment.
 */
export function isInlineComment (comment: Comment): boolean {
	return Boolean((`inline` in comment && comment.inline) || comment.raws.inline)
}
