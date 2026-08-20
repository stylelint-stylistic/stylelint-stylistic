import selectorParser from "postcss-selector-parser"

/**
 * Runs a callback over a rule's parsed selector and writes the result back into the rule.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result.
 * @param {import('postcss').Rule} node - The rule node containing the selector.
 * @param {(root: import('postcss-selector-parser').Root) => void} callback - The callback to transform the selector.
 * @returns {string | undefined} The selector as the callback left it, or undefined where the parser refused it.
 */
export function transformSelector (result, node, callback) {
	try {
		return selectorParser(callback).processSync(node, { updateSelector: true })
	}
	catch {
		result.warn(`Cannot parse selector`, { node, stylelintType: `parseError` })
	}
}
