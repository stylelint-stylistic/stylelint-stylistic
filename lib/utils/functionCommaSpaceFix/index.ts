import type { DivNode as ValueParserDivNode, FunctionNode as ValueParserFunctionNode } from "postcss-value-parser"

import type { Edit } from "../applyEditsFromEnd/index.ts"

/**
 * Measures the whitespace run on one side of a comma that the comma's div node does not hold.
 *
 * `postcss-value-parser` gives the run between two dividers to the `after` of the first, the run behind the opening parenthesis to the function's `before`, and the run in front of the closing one to the function's `after`; there the comma's own span is empty ([#349](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/349)).
 * @param index - The comma's place among the arguments.
 * @param functionNode - The call holding the arguments.
 * @param position - The side of the comma.
 * @returns The length of the run the neighbour holds, or zero.
 */
function runHeldByNeighbour (index: number, functionNode: ValueParserFunctionNode, position: `before` | `after`): number {
	let { nodes } = functionNode

	if (position === `before`) {
		if (index === 0) return functionNode.before.length

		let previous = nodes[index - 1]

		return previous?.type === `div` ? previous.after.length : 0
	}

	return index === nodes.length - 1 ? functionNode.after.length : 0
}

/**
 * Names the span one side of a comma stands in, and what goes there. The span grows away from the comma by what {@link runHeldByNeighbour} measures; an unclosed function has an empty `after`.
 * @param div - The comma node.
 * @param index - The comma's place among the arguments.
 * @param functionNode - The call holding the comma.
 * @param position - The side of the comma.
 * @param text - The whitespace to put there.
 * @returns The edit.
 */
function whitespaceEdit (div: ValueParserDivNode, index: number, functionNode: ValueParserFunctionNode, position: `before` | `after`, text: string): Edit {
	let commaIndex = div.sourceIndex + div.before.length
	let held = runHeldByNeighbour(index, functionNode, position)

	if (position === `before`) return { start: div.sourceIndex - held, end: commaIndex, text }

	return { start: commaIndex + div.value.length, end: div.sourceEndIndex + held, text }
}

/**
 * Fixes whitespace around commas in function arguments. Nothing is written: the fix comes back as spans of the value for the caller to write. The function is taken whole, since it may hold the run beside a comma itself.
 * @param params - The parameters object.
 * @returns The edits.
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

		// A comment behind the comma closes the div, and the whitespace after it becomes nodes of its own, emptied one by one. The run behind the comma is walked whichever side the option writes.
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
