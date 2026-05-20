/**
 * Adds an empty line after a node. Mutates the node.
 * @template {import('postcss').Rule | import('postcss').AtRule} T
 * @param {T} node - The PostCSS node to modify.
 * @param {string} newline - The newline character to use.
 * @returns {T} The modified node.
 */
export function addEmptyLineAfter (node, newline) {
	let { raws } = node

	if (typeof raws.after !== `string`) return node

	let spaces = raws.after.split(`;`)
	let after = spaces.at(-1) || ``

	if ((/\r?\n/u).test(after)) raws.after = raws.after.replace(/(\r?\n)/u, `${newline}$1`)
	else raws.after += newline.repeat(2)

	return node
}
