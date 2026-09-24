import type { Comment, Node as PostcssNode } from "postcss"

import { isComment } from "../typeGuards/index.ts"

/**
 * Gets the next non-comment node at or after a given node.
 *
 * A loop, not a recursion: nothing bounds a run of comments, and eleven thousand in a row overflowed the stack. `onComment` lets a caller touch the comments stepped over, so no rule needs a recursive copy of its own.
 * @param startNode - The starting node.
 * @param onComment - Called for each comment stepped over, with the node behind it.
 * @returns The next non-comment node, or null.
 */
export function nextNonCommentNode (startNode: PostcssNode | undefined, onComment?: (comment: Comment, nextNode: PostcssNode | undefined) => void): PostcssNode | null {
	let node = startNode

	while (node && node.next) {
		if (!isComment(node)) return node

		let nextNode = node.next()

		onComment?.(node, nextNode)

		node = nextNode
	}

	return null
}
