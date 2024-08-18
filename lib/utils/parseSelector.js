import selectorParser from "postcss-selector-parser"

/**
 * @param {string} selector
 * @param {import('stylelint').PostcssResult} result
 * @param {import('postcss').Node} node
 * @param {(root: import('postcss-selector-parser').Root) => void} [callback] - Deprecated. It will be removed in the future.
 * @returns {import('postcss-selector-parser').Root | undefined}
 */
export default function parseSelector (selector, result, node, callback) {
	if (!selector) return undefined

	try {
		// TODO: Remove `callback` in the future. See https://github.com/stylelint/stylelint/pull/7647.
		if (callback) return selectorParser(callback).processSync(selector)

		return selectorParser().astSync(selector)
	} catch (err) {
		result.warn(`Cannot parse selector (${err})`, { node, stylelintType: `parseError` })

		return undefined
	}
}
