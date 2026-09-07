import type { Node } from "postcss"
import selectorParser, { type Root } from "postcss-selector-parser"
import type { PostcssResult } from "stylelint"

/**
 * Parses a selector with `postcss-selector-parser`.
 * @param selector - The text handed to the parser.
 * @param result - The Stylelint result, warned on a parse error.
 * @param node - The node the warning is reported on.
 * @returns The tree, or undefined on an empty selector or a parse error.
 */
export function parseSelector (selector: string, result: PostcssResult, node: Node): Root | undefined {
	if (!selector) return

	try {
		return selectorParser().astSync(selector)
	}
	catch (err) {
		result.warn(`Cannot parse selector (${err})`, { node, stylelintType: `parseError` })
	}
}
