import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeString } from "../nodeString/index.ts"

/**
 * Prints a node with its `raws.before`, as the file spells both.
 * @param node - The node printed.
 * @param result - The Stylelint result, holding the syntax.
 * @returns The raw before string and the node.
 */
export function rawNodeString (node: Node, result?: PostcssResult): string {
	let before = node.raws.before

	return (typeof before === `string` ? before : ``) + nodeString(node, result)
}
