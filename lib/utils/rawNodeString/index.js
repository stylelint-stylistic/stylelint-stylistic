/**
 * Stringify PostCSS node including its raw "before" string.
 *
 * @param {import('postcss').Node} node
 *
 * @returns {string}
 */
export function rawNodeString (node) {
	let result = ``

	if (node.raws.before) {
		result += node.raws.before
	}

	result += node.toString()

	return result
}
