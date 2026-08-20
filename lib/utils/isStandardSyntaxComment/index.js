/**
 * Checks if a comment has standard syntax.
 * @param {import('postcss').Comment} comment - The comment node to check.
 * @returns {boolean} True if the comment has standard syntax, false otherwise.
 */
export function isStandardSyntaxComment (comment) {
	// Both are asked, since the Sass parser marks an inline comment with `raws.inline` and the Less parser with `inline`.
	if (`inline` in comment) return false

	if (`inline` in comment.raws) return false

	return true
}
