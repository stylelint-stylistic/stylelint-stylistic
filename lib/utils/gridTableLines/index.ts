import type { Node as ValueNode } from "postcss-value-parser"

import { LAST_LINE, LINE_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"

/** A stretch of the value, by parse indices. */
export type Span = {
	start: number,
	end: number,
}

/** The columns of a line: names, the row, its size, what follows. */
export type GridColumn = `names` | `row` | `size` | `trailing`

/** One row line of a grid shorthand, read as table cells. */
export type GridTableLine = {

	/** The tokens of the line with their columns, in order. */
	tokens: { span: Span, column: GridColumn }[],

	/** The whitespace runs between tokens, written by the rule laying the table out. */
	gaps: Span[],
}

/**
 * Asks whether a line break stands in a node that is no row.
 *
 * A `named-grid-areas-alignment` fix collapses a row's whitespace, so a break there is about to be written over ([#402](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/402)). Sliced from the value, since a blanked comment is spaces in the parse copy.
 * @param value - The grid shorthand's value text.
 * @param nodes - Its parse, comments blanked.
 * @returns True where a break stands outside every row.
 */
export function spansLinesOutsideRows (value: string, nodes: ValueNode[]): boolean {
	return nodes.some((node) => node.type !== `string` && LINE_BREAK.test(value.slice(node.sourceIndex, node.sourceEndIndex)))
}

/**
 * Reads the row lines of a grid shorthand as table cells ([#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)).
 *
 * A line is the stretch between two break-holding whitespace nodes, and is a row where it holds exactly one top-level string with only code in front. Its tokens run to the first `/` or comment: line names before the string, the size behind it unless it opens on `[`, then the closing names.
 * @param value - The grid shorthand's value text.
 * @param nodes - Its parse, comments blanked.
 * @returns The row lines; none for a value on one line.
 */
export function gridTableLines (value: string, nodes: ValueNode[]): GridTableLine[] {
	if (!spansLinesOutsideRows(value, nodes)) return []

	let lines: GridTableLine[] = []
	let segment: ValueNode[] = []
	// A comment right behind a break is folded into the break's node; the next segment opens on it unseen
	let opensOnComment = false

	/** Reads one segment between two breaks. */
	function closeSegment (): void {
		let nodesOfLine = segment
		let skipped = opensOnComment

		segment = []
		opensOnComment = false

		if (skipped || nodesOfLine.filter((node) => node.type === `string`).length !== 1) return

		let tokens: GridTableLine[`tokens`] = []
		let gaps: Span[] = []
		let rowSeen = false
		let pending: Span | undefined

		for (let node of nodesOfLine) {
			let slice = value.slice(node.sourceIndex, node.sourceEndIndex)

			if (node.type === `space`) {
				// A comment is spaces in the parse and text in the value; the tokens end there
				if (!WHITESPACE_OR_NOTHING.test(slice)) break

				if (tokens.length > 0) pending = { start: node.sourceIndex, end: node.sourceEndIndex }

				continue
			}

			if (node.type === `div` || node.type === `comment`) break

			let column: GridColumn = rowSeen ? (tokens.at(-1)?.column === `row` && !slice.startsWith(`[`) ? `size` : `trailing`) : (node.type === `string` ? `row` : `names`)

			if (node.type === `string`) rowSeen = true

			if (pending) gaps.push(pending)

			pending = undefined
			tokens.push({ span: { start: node.sourceIndex, end: node.sourceEndIndex }, column })
		}

		if (tokens.some(({ column }) => column === `row`)) lines.push({ tokens, gaps })
	}

	for (let node of nodes) {
		let slice = value.slice(node.sourceIndex, node.sourceEndIndex)

		if (node.type === `space` && LINE_BREAK.test(slice)) {
			closeSegment()
			opensOnComment = !WHITESPACE_OR_NOTHING.test(slice.match(LAST_LINE)?.[0] ?? ``)
			continue
		}

		segment.push(node)
	}

	closeSegment()

	return lines
}
