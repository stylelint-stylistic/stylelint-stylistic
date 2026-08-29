export type PostcssChildNode = import("postcss").ChildNode
export type PostcssContainer = import("postcss").Container

/**
 * Gets the last node of a container that is not a comment.
 *
 * This is the node PostCSS itself hangs a block's `raws.semicolon` on: its stringifier walks back from the end of the block past the comments and writes the semicolon behind the node it stops at. A comment standing between that node and the closing brace is a node of its own, and the last one, so a rule asking which node closes the block has to walk the same way rather than read `container.last`. A nested rule or at-rule is not passed over: it is a node the flag speaks of, and the declaration in front of it keeps its own semicolon.
 *
 * A block of comments and nothing else is the one place the two walks part: the stringifier stops on the first node whether or not it is a comment, and this hands back nothing at all. It prints the same either way — a comment carries no semicolon whatever the flag says — so nothing turns on which of the two a caller reads.
 * @param container - The container to look inside.
 * @returns The last non-comment node, or null where the container holds none.
 */
export function lastNonCommentNode (container: PostcssContainer | undefined): PostcssChildNode | null {
	let node = container ? container.last : undefined

	while (node && node.type === `comment`) node = node.prev()

	return node ?? null
}
