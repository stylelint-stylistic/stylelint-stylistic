/** @typedef {import('postcss').Node} PostcssNode */

/**
 * Gets the next non-comment node in a PostCSS AST at or after a given node.
 *
 * The walk is a loop rather than a call to itself, and has to stay one: nothing bounds the run of comments a stylesheet may hold, so a comment has to cost the walk a step and not a stack frame. Around eleven thousand of them in a row used to end the run in `RangeError: Maximum call stack size exceeded` instead of a report. Elsewhere in the plugin the same question is walked by `lastNonCommentNode`, by the `prevNonComment` of `selectorCombinatorSpaceChecker` and by the `isLeftOverOfCombinator` of `selector-descendant-combinator-no-non-space`, and all three are loops. The `nextNode` of `block-opening-brace-newline-after` is not: it is this walk carrying a write of its own, it is still a call to itself, and it still overflows on such a run. It reaches this utility through no caller, so nothing done here touches it, and it is filed as #409.
 * @param {PostcssNode | void} startNode - The starting node.
 * @returns {PostcssNode | null} The next non-comment node, or null if none exists.
 */
export function nextNonCommentNode (startNode) {
	let node = startNode

	while (node && node.next) {
		if (node.type !== `comment`) return node

		node = node.next()
	}

	return null
}
