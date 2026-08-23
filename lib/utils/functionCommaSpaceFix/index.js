/** @typedef {import('../applyEditsFromEnd/index.js').Edit} Edit */
/** @typedef {import('postcss-value-parser').DivNode} ValueParserDivNode */
/** @typedef {import('postcss-value-parser').Node} ValueParserNode */

/**
 * Names the span one side of a comma stands in, and what goes there.
 *
 * A div node opens where its own leading whitespace does and ends where the whitespace behind the divider does, so both sides are spans of the value the file spells, and either one is replaced where it stands.
 * @param {ValueParserDivNode} div - The comma node.
 * @param {'before' | 'after'} position - The side of the comma to write.
 * @param {string} text - The whitespace to put there.
 * @returns {Edit} The edit that writes it.
 */
function whitespaceEdit (div, position, text) {
	let commaIndex = div.sourceIndex + div.before.length

	if (position === `before`) return { start: div.sourceIndex, end: commaIndex, text }

	return { start: commaIndex + div.value.length, end: div.sourceEndIndex, text }
}

/**
 * Fixes whitespace around commas in function arguments.
 *
 * Nothing is written here and nothing in the parsed tree is touched: the fix is given back as the spans of the value it changes, so that the caller writes those and leaves every other character of the value as the file spells it.
 * @param {{
 *   div: ValueParserDivNode,
 *   index: number,
 *   nodes: ValueParserNode[],
 *   expectation: string,
 *   position: 'before' | 'after',
 *   symb: string,
 * }} params - The parameters object.
 * @returns {Edit[]} The edits the fix writes, each one a span of the value the file spells.
 */
export function functionCommaSpaceFix (params) {
	let { div, index, nodes, expectation, position, symb } = params

	if (expectation.startsWith(`always`)) return [whitespaceEdit(div, position, symb)]

	if (expectation.startsWith(`never`)) {
		let edits = [whitespaceEdit(div, position, ``)]

		// A comment standing behind the comma closes the div there and hands the whitespace after it to nodes of its own, so the run is emptied node by node and one fix comes out as several edits. The run behind the comma is walked whichever side the option writes, as it always has been: under `before` that is the far side of the comma, which is a reading of its own and not one this branch changes.
		for (let i = index + 1; i < nodes.length; i += 1) {
			let node = nodes[i]

			if (node === undefined) continue

			if (node.type === `comment`) continue

			if (node.type === `space`) {
				edits.push({ start: node.sourceIndex, end: node.sourceEndIndex, text: `` })
				continue
			}

			break
		}

		return edits
	}

	return []
}
