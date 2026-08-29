type Edit = import("../applyEditsFromEnd/index.ts").Edit
type ValueParserDivNode = import("postcss-value-parser").DivNode
type ValueParserFunctionNode = import("postcss-value-parser").FunctionNode

/**
 * Measures the whitespace run standing on one side of a comma that the comma itself does not hold.
 *
 * A div node opens where its own leading whitespace does and ends where the whitespace behind the divider does, so most of the time either side of a comma is a span of that node. `postcss-value-parser` hands a run to whichever neighbour will hold it, though, and three of those neighbours are not the comma: the run between two dividers goes to the `after` of the one in front — any divider, a slash and a colon as readily as a comma — the run between the opening parenthesis and the first node goes to the function's `before`, and the run between the last node and the closing parenthesis to the function's `after`. In each of the three the comma's own `before` or `after` is empty, so what this measures is added to a span that would otherwise be empty; everywhere else it is zero and the span is the comma's own (#349).
 * @param index - The comma's place among the arguments.
 * @param functionNode - The function the comma divides the arguments of.
 * @param position - The side of the comma being written.
 * @returns The length of the run the neighbour holds, or zero where the comma holds its own.
 */
function runHeldByNeighbour (index: number, functionNode: ValueParserFunctionNode, position: `before` | `after`): number {
	let { nodes } = functionNode

	if (position === `before`) {
		if (index === 0) return functionNode.before.length

		let previous = nodes[index - 1]

		return previous.type === `div` ? previous.after.length : 0
	}

	return index === nodes.length - 1 ? functionNode.after.length : 0
}

/**
 * Names the span one side of a comma stands in, and what goes there.
 *
 * The span reaches over the whole run the file spells there, wherever the parser filed it: {@link runHeldByNeighbour} says how much of it the comma does not hold, and the span grows away from the comma by that much. An unclosed function needs nothing of its own — the parser gives such a function an empty `after`, whatever the text behind its last node, so the length asked for there is zero and the span is the one it always was.
 * @param div - The comma node.
 * @param index - The comma's place among the arguments.
 * @param functionNode - The function the comma divides the arguments of.
 * @param position - The side of the comma to write.
 * @param text - The whitespace to put there.
 * @returns The edit that writes it.
 */
function whitespaceEdit (div: ValueParserDivNode, index: number, functionNode: ValueParserFunctionNode, position: `before` | `after`, text: string): Edit {
	let commaIndex = div.sourceIndex + div.before.length
	let held = runHeldByNeighbour(index, functionNode, position)

	if (position === `before`) return { start: div.sourceIndex - held, end: commaIndex, text }

	return { start: commaIndex + div.value.length, end: div.sourceEndIndex + held, text }
}

/**
 * Fixes whitespace around commas in function arguments.
 *
 * Nothing is written here and nothing in the parsed tree is touched: the fix is given back as the spans of the value it changes, so that the caller writes those and leaves every other character of the value as the file spells it.
 *
 * The function is taken whole rather than as its list of arguments, since the run standing beside a comma may be held by the function itself and not by any argument of it.
 * @param params - The parameters object.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
export function functionCommaSpaceFix (params: {
	div: ValueParserDivNode,
	index: number,
	functionNode: ValueParserFunctionNode,
	expectation: string,
	position: `before` | `after`,
	symb: string,
}): Edit[] {
	let { div, index, functionNode, expectation, position, symb } = params
	let { nodes } = functionNode

	if (expectation.startsWith(`always`)) return [whitespaceEdit(div, index, functionNode, position, symb)]

	if (expectation.startsWith(`never`)) {
		let edits = [whitespaceEdit(div, index, functionNode, position, ``)]

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

export type { Edit, ValueParserDivNode, ValueParserFunctionNode }
