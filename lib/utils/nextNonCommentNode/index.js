/** @typedef {import('postcss').Node} PostcssNode */

/**
 * Gets the next non-comment node in a PostCSS AST at or after a given node.
 * @param {PostcssNode | void} startNode - The starting node.
 * @returns {PostcssNode | null} The next non-comment node, or null if none exists.
 */
export function nextNonCommentNode (startNode) {
	let node = startNode

	// Walk forward iteratively rather than recursing once per comment: a long
	// run of comments would otherwise overflow the stack (see #360). The
	// original recursion returned null as soon as it reached a node without a
	// `next` method, so the loop keeps that same guard on every step.
	while (node && node.next) {
		if (node.type !== `comment`) return node

		node = node.next()
	}

	return null
}
