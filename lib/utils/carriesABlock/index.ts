import type { ChildNode, Container } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"

/**
 * Asks whether a node carries a block. Put to the node, not to a list of types, so a Sass nested property written with a value, the one declaration `postcss-scss` gives a block, is answered like a rule: a container however typed.
 * @param node - A node of the walk.
 * @returns True where it carries a block.
 */
export function carriesABlock (node: ChildNode): node is ChildNode & Container {
	return hasBlock(node)
}
