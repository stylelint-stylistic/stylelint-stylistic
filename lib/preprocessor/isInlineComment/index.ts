import type { Comment } from "postcss"

/**
 * Asks whether the syntax read a comment as a `//` one: `postcss-less` marks it with `inline`, `postcss-scss` with `raws.inline`.
 * @param comment - The comment node the syntax made.
 * @returns True where it did.
 */
export function isInlineComment (comment: Comment): boolean {
	return Boolean((`inline` in comment && comment.inline) || comment.raws.inline)
}
