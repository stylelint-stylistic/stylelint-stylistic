import { beforeBlockString } from "../beforeBlockString/index.js"
import { hasBlock } from "../hasBlock/index.js"
import { rawNodeString } from "../rawNodeString/index.js"

/**
 * Returns a CSS statement's block — the string that starts with `{` and ends with `}`. If the statement has no block (e.g. `@import url(foo.css);`), returns an empty string.
 * @param {import('postcss').Container} statement - The PostCSS container node.
 * @param {import('stylelint').PostcssResult} [result] - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {string} The block string content.
 */
export function blockString (statement, result) {
	if (!hasBlock(statement)) return ``

	return rawNodeString(statement, result).slice(beforeBlockString(statement, result).length)
}
