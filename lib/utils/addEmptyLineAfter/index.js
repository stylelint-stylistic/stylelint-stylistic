/**
 * Add an empty line after a node. Mutates the node.
 *
 * @template {import('postcss').Rule | import('postcss').AtRule} T
 * @param {T} node
 * @param {string} newline
 * @returns {T}
 */
export function addEmptyLineAfter (node, newline) {
	let { raws } = node

	if (typeof raws.after !== `string`) {
		return node
	}

	let spaces = raws.after.split(`;`)
	let after = spaces[spaces.length - 1] || ``

	if (!(/\r?\n/).test(after)) {
		raws.after += newline.repeat(2)
	} else {
		raws.after = raws.after.replace(/(\r?\n)/, `${newline}$1`)
	}

	return node
}
