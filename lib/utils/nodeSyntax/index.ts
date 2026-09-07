import type { Node, Syntax } from "postcss"
import type { PostcssResult } from "stylelint"

/**
 * The syntax a node was parsed with, which prints it back. An embedded stylesheet has its own block's syntax, not the page's.
 * @param node - The node whose root is asked.
 * @param result - The Stylelint result.
 * @returns That syntax, undefined for plain CSS.
 */
export function nodeSyntax (node: Node, result?: PostcssResult): Syntax | undefined {
	let root = node.root()

	return (root.source && (root.source as { syntax?: Syntax }).syntax) || (result && result.opts && result.opts.syntax)
}
