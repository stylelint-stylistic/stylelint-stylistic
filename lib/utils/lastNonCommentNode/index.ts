import type { ChildNode, Container } from "postcss"

/**
 * Gets the last non-comment node of a container: the node PostCSS hangs a block's `raws.semicolon` on.
 *
 * The stringifier walks back past the comments and writes the semicolon behind the node it stops at; a nested rule or at-rule counts. For a block of comments alone it stops on the first node and this returns null; both print the same.
 * @param container - The block whose children are walked back.
 * @returns The node, or null.
 */
export function lastNonCommentNode (container: Container | undefined): ChildNode | null {
	let node = container ? container.last : undefined

	while (node && node.type === `comment`) node = node.prev()

	return node ?? null
}
