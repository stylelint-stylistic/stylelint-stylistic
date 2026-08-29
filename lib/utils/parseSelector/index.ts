import selectorParser from "postcss-selector-parser"

/**
 * Parses a CSS selector string using postcss-selector-parser.
 * @param selector - The selector string to parse.
 * @param result - The Stylelint result object.
 * @param node - The PostCSS node for error reporting.
 * @returns The parsed selector, or undefined where there is no selector to parse or the parser refuses it.
 */
export function parseSelector (selector: string, result: import("stylelint").PostcssResult, node: import("postcss").Node): import("postcss-selector-parser").Root | undefined {
	if (!selector) return

	try {
		return selectorParser().astSync(selector)
	}
	catch (err) {
		result.warn(`Cannot parse selector (${err})`, { node, stylelintType: `parseError` })
	}
}
