import type { Node as ValueNode } from "postcss-value-parser"

import { LAST_LINE, LINE_BREAK, WHITESPACE_OR_NOTHING } from "../../regexps.ts"

/** A stretch of the value, by the indices the parse counts in it. */
export type Span = {
	start: number,
	end: number,
}

/** The columns a line of a grid shorthand is read as: the line names in front of the row, the row, the size behind it, and whatever stands behind the size — the line names closing the row, most often. */
export type GridColumn = `names` | `row` | `size` | `trailing`

/** One line of a grid shorthand that holds a row, read as the cells of a table. */
export type GridTableLine = {

	/** The tokens of the line, each with the column it falls in, in the order they stand. */
	tokens: { span: Span, column: GridColumn }[],

	/** The runs of whitespace standing between two consecutive tokens, which are the runs a rule laying the table out writes and a rule about runs of whitespace leaves to it. */
	gaps: Span[],
}

/**
 * Asks whether a value spans lines outside its rows: a line break standing in a node that is no row.
 *
 * Every fix `named-grid-areas-alignment` makes to a row collapses the whitespace inside it, line breaks included, so a break inside a row is a character the fix is about to write over, while every other node goes back as the file spells it — a break there is one the fix leaves (#402). The slice is taken from the value and not from the copy the parse was made over, since a blanked comment is spaces there, the breaks of its text among them, and a comment spanning two lines is a break the fix leaves standing.
 * @param value - The value, as the file spells it.
 * @param nodes - The nodes of its parse, made over a copy with the comments blanked.
 * @returns True where a break stands outside every row.
 */
export function spansLinesOutsideRows (value: string, nodes: ValueNode[]): boolean {
	return nodes.some((node) => node.type !== `string` && LINE_BREAK.test(value.slice(node.sourceIndex, node.sourceEndIndex)))
}

/**
 * Reads the lines of a grid shorthand that hold a row as the cells of a table (#45).
 *
 * A line is the stretch between two whitespace nodes holding a line break, the first opening on the value's first node and the last closing on its last. A line is read as a row of the table where it holds exactly one string at the top level of the value, that string being the row, and where nothing but code stands in front of it: its tokens run from its first node that is no whitespace to the first solidus or comment, whichever comes first — a comment is spaces in the parse, so it is a whitespace node whose slice of the value spells something, and the solidus with the runs beside it is one `div` node the rules about the whitespace beside a solidus read. Every token before the string is a line name, the string is the row, the first token behind it is its size unless it opens on a bracket, and the rest are the names closing the row. The columns are read off the positions and not off the grammar: a token is what stands where, and the layout is what the layout makes of it.
 *
 * A value that spans no line outside its rows has no table, as it has no cells to pad: a shorthand on one line is left as it stands, as the longhand is.
 * @param value - The value, as the file spells it.
 * @param nodes - The nodes of its parse, made over a copy with the comments blanked.
 * @returns The lines holding a row, in order; none where the value spans no line outside its rows.
 */
export function gridTableLines (value: string, nodes: ValueNode[]): GridTableLine[] {
	if (!spansLinesOutsideRows(value, nodes)) return []

	let lines: GridTableLine[] = []
	let segment: ValueNode[] = []
	// A comment standing right behind a break is spaces in the parse, and the parser folds them into the one whitespace node the break stands in, so the segment behind such a node opens on a comment and never sees it: the node says so for it
	let opensOnComment = false

	/**
	 * Reads one segment of the value, between two breaks.
	 */
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
				// A comment is spaces in the parse and text in the value, and the tokens of the line end in front of it
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
