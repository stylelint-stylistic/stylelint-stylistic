import type { Comment } from "postcss"

/**
 * Checks if a comment has standard syntax.
 * @param comment - The comment node to check.
 * @returns True if the comment has standard syntax, false otherwise.
 */
export function isStandardSyntaxComment (comment: Comment): boolean {
	// The Sass parser marks an inline comment with `raws.inline`; the Less parser's `inline` mark is the less namespace's to read.
	if (`inline` in comment.raws) return false

	return true
}
