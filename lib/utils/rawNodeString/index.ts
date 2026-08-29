import type { Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeString } from "../nodeString/index.ts"

/**
 * Prints a node together with its raw "before" string, as the file spells both.
 * @param node - The PostCSS node to stringify.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The stringified node including raw before string.
 */
export function rawNodeString (node: Node, result?: PostcssResult): string {
	let before = node.raws.before

	return (typeof before === `string` ? before : ``) + nodeString(node, result)
}
