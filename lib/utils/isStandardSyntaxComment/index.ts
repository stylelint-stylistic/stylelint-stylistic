/**
 * Checks if a comment has standard syntax.
 * @param comment - The comment node to check.
 * @returns True if the comment has standard syntax, false otherwise.
 */
export function isStandardSyntaxComment (comment: import("postcss").Comment): boolean {
	// Both are asked, since the Sass parser marks an inline comment with `raws.inline` and the Less parser with `inline`.
	if (`inline` in comment) return false

	if (`inline` in comment.raws) return false

	return true
}
