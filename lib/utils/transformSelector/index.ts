import selectorParser from "postcss-selector-parser"

/**
 * Runs a callback over a rule's parsed selector and writes the result back into the rule.
 * @param result - The Stylelint result.
 * @param node - The rule node containing the selector.
 * @param callback - The callback to transform the selector.
 * @returns The selector as the callback left it, or undefined where the parser refused it.
 */
export function transformSelector (result: import("stylelint").PostcssResult, node: import("postcss").Rule, callback: (root: import("postcss-selector-parser").Root) => void): string | undefined {
	try {
		return selectorParser(callback).processSync(node, { updateSelector: true })
	}
	catch {
		result.warn(`Cannot parse selector`, { node, stylelintType: `parseError` })
	}
}
