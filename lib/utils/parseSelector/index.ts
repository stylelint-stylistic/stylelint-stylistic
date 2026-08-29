import type { Node } from "postcss"
import selectorParser, { type Root } from "postcss-selector-parser"
import type { PostcssResult } from "stylelint"

/**
 * Parses a CSS selector string using postcss-selector-parser.
 * @param selector - The selector string to parse.
 * @param result - The Stylelint result object.
 * @param node - The PostCSS node for error reporting.
 * @returns The parsed selector, or undefined where there is no selector to parse or the parser refuses it.
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
