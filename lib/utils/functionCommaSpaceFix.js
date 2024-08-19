/**
 * @param {{
 *   div: import('postcss-value-parser').DivNode,
 *   index: number,
 *   nodes: import('postcss-value-parser').Node[],
 *   expectation: string,
 *   position: 'before' | 'after',
 *   symb: string,
 * }} params
 * @returns {boolean}
 */
export default function functionCommaSpaceFix (params) {
	let { div, index, nodes, expectation, position, symb } = params

	if (expectation.startsWith(`always`)) {
		div[position] = symb

		return true
	}

	if (expectation.startsWith(`never`)) {
		div[position] = ``

		for (let i = index + 1; i < nodes.length; i++) {
			let node = nodes[i]

			if (node === undefined) {
				continue
			}

			if (node.type === `comment`) {
				continue
			}

			if (node.type === `space`) {
				node.value = ``
				continue
			}

			break
		}

		return true
	}

	return false
}
