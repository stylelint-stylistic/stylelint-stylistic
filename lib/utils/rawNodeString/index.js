import { nodeString } from "../nodeString/index.js"

/**
 * Prints a node together with its raw "before" string, as the file spells both.
 * @param {import('postcss').Node} node - The PostCSS node to stringify.
 * @param {import('stylelint').PostcssResult} [result] - The Stylelint result, which holds the syntax the file was opened with.
 * @returns {string} The stringified node including raw before string.
 */
export function rawNodeString (node, result) {
	let before = node.raws.before

	return (typeof before === `string` ? before : ``) + nodeString(node, result)
}
