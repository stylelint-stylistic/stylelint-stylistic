import { isComment } from "../typeGuards/index.ts"

type PostcssNode = import("postcss").Node

/**
 * Gets the next non-comment node in a PostCSS AST at or after a given node.
 *
 * The walk is a loop rather than a call to itself, and has to stay one: nothing bounds the run of comments a stylesheet may hold, so a comment has to cost the walk a step and not a stack frame. Around eleven thousand of them in a row used to end the run in `RangeError: Maximum call stack size exceeded` instead of a report. Elsewhere in the plugin the same question is walked by `lastNonCommentNode`, by the `prevNonComment` of `selectorCombinatorSpaceChecker` and by the `isLeftOverOfCombinator` of `selector-descendant-combinator-no-non-space`, and all three are loops.
 *
 * `onComment` is what a caller that has to touch the comments it steps over asks through this walk rather than beside it: `block-opening-brace-newline-after` kept a copy of the walk for its own write, the copy stayed a call to itself when this one stopped being one, and it went on overflowing on such a run until #409 folded it back in here.
 * @param startNode - The starting node.
 * @param onComment - Called for each comment the walk steps over, with the node standing behind that comment.
 * @returns The next non-comment node, or null if none exists.
 */
export function nextNonCommentNode (startNode: PostcssNode | undefined, onComment?: (comment: import("postcss").Comment, nextNode: PostcssNode | undefined) => void): PostcssNode | null {
	let node = startNode

	while (node && node.next) {
		if (!isComment(node)) return node

		let nextNode = node.next()

		onComment?.(node, nextNode)

		node = nextNode
	}

	return null
}

export type { PostcssNode }
