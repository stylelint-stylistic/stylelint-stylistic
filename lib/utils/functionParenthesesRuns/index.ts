import valueParser, { type FunctionNode } from "postcss-value-parser"

import { LEADING_CSS_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpanHolding } from "../findCommentSpans/index.ts"
import { opensAnAddress } from "../opensAnAddress/index.ts"
import { quotesItsAddress } from "../quotesItsAddress/index.ts"

/**
 * The runs at the parentheses of a call and of every call nested in it that the rule reads, which the rule writes in one pass; a write is judged for lines by what they leave once all of them are written ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)). A `never-multi-line` fix reaches further, into every stretch it measured, so over a call holding a comment the judgment here is the cautious one.
 * @param valueNode - The call.
 * @param comments - The comment spans of the value, both kinds.
 * @param reads - Whether the rule reads a nested call's parentheses.
 * @returns The runs.
 */
export function parenthesesRuns (valueNode: FunctionNode, comments: CommentSpan[], reads: (call: FunctionNode) => boolean): string[] {
	let runs = [valueNode.before, valueNode.after]

	valueParser.walk(valueNode.nodes, (node, at, siblings) => {
		if (node.type !== `function`) return

		// As the rules' own walks read it: a bare address holds no call of the value, a quoted one holds its arguments' calls, and a call in a comment's text is none
		if (opensAnAddress(node, at, siblings)) return quotesItsAddress(node) ? undefined : false

		if (findCommentSpanHolding(node, comments) || !reads(node)) return

		runs.push(node.before, node.after)
	})

	return runs
}

/**
 * The span of the whitespace in front of a call's closing parenthesis.
 *
 * An unclosed call never gets here, so the node ends on the parenthesis; the closing warning is placed from the span's end too.
 * @param valueNode - The call.
 * @returns The span, in the value's coordinates.
 */
export function getAfterSpan (valueNode: FunctionNode): {
	start: number,
	end: number,
} {
	let end = valueNode.sourceEndIndex - 1

	return { start: end - valueNode.after.length, end }
}

/**
 * Reads the whitespace behind a call's `(`, up to its first significant node, and where that node begins.
 *
 * A comment between the `(` and the break is walked past and the whitespace behind it counted; nodes are placed against the comment spans, since the value parser reads a `//` comment as nodes. In a call of comments and whitespace alone the first significant thing is its closing `)`. The stretches come back for the `never` guard, and their count says whether the break rule writes the very run the space rule does ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)): the first stretch is the space rule's, and the break rule's `always` writes into the last.
 * @param valueNode - The call.
 * @param openingIndex - Where the text behind the `(` begins.
 * @param declValue - The value the positions count in.
 * @param comments - The comment spans of the value, both kinds.
 * @returns The whitespace, where the first significant thing begins, and the stretches measured.
 */
export function readOpeningRuns (valueNode: FunctionNode, openingIndex: number, declValue: string, comments: CommentSpan[]): {
	before: string,
	firstIndex: number,
	measured: [number, number][],
} {
	let before = valueNode.before
	let measured: [number, number][] = [[openingIndex, openingIndex + valueNode.before.length]]
	let firstIndex = valueNode.sourceEndIndex - 1

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		let span = findCommentSpanHolding(node, comments)

		if (span) {
			// A node held by a comment can reach past the span's end, with whitespace the parser hangs behind a `/`, `:` or `,`, or with code read across the break; only the whitespace at the front of the overrun is the value's (#303). A run rather than one break, since the indentation of the next line is the value's too.
			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				before += whitespace
				measured.push([span.end, span.end + whitespace.length])

				// Code behind that whitespace is the first significant thing, whatever node it is filed under
				if (whitespace.length !== overrun.length) {
					firstIndex = span.end + whitespace.length
					break
				}
			}

			continue
		}

		if (node.type === `space`) {
			before += node.value
			measured.push([node.sourceIndex, node.sourceEndIndex])
			continue
		}

		if (node.type === `div`) {
			// The parser hangs the whitespace in front of a `/`, `:` or `,` on the node, so a div opens in front of its own text: the first slash of a `//` comment standing behind another comment opens one whose `sourceIndex` is the run in front of the span ([#505](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/505)). That run is the value's, and the comment is walked past like any other. The run is whitespace to the parser and a span opens on a `/`, so the span opens where the div's text does.
			let textSpan = findCommentSpanAt(node.sourceIndex + node.before.length, comments)

			if (textSpan) {
				// The parser calls every character below the space whitespace where the tokenizer calls most of them words, and `splitSpaceNodesAtWords` rewrites the space nodes alone, never a div's own run (#496)
				let whitespace = (node.before.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				before += whitespace
				measured.push([node.sourceIndex, node.sourceIndex + whitespace.length])

				// A word behind that whitespace is the first significant thing, as it is behind the whitespace a node overruns its comment with
				if (whitespace.length !== node.before.length) {
					firstIndex = node.sourceIndex + whitespace.length
					break
				}

				continue
			}
		}

		firstIndex = node.sourceIndex
		break
	}

	return { before, firstIndex, measured }
}

/**
 * Reads the whitespace in front of a call's closing `)`: the node's `after` and every whitespace node behind the last significant one.
 *
 * The mirror of {@link readOpeningRuns}: a node held by a block comment is read the same way, since the closing slash of `/*\/` is a division sign to the parser and the whitespace behind it is the value's ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)). An inline comment ends the walk, since no fix may take the break closing it. The stretches come back for the `never` fix; the last of them is the `after` span, which the space rule writes and the break rule writes wherever it writes at all.
 *
 * A div opening in front of its own text is asked nothing here ([#505](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/505)): the run the parser hung on it stands in front of the comment rather than beside the `)`, and the only span that opens where such a div's text does is an inline comment's, which ends this walk exactly as an unplaced div does.
 * @param valueNode - The call.
 * @param declValue - The value the positions count in.
 * @param comments - The comment spans of the value, both kinds.
 * @returns The whitespace and the stretches measured, in value order.
 */
export function readClosingRuns (valueNode: FunctionNode, declValue: string, comments: CommentSpan[]): {
	after: string,
	measured: [number, number][],
} {
	let after = valueNode.after
	let { start, end } = getAfterSpan(valueNode)
	let measured: [number, number][] = [[start, end]]

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		let span = findCommentSpanHolding(node, comments)

		if (span) {
			if (span.isInline) break

			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				after = whitespace + after
				measured.unshift([node.sourceEndIndex - whitespace.length, node.sourceEndIndex])

				if (whitespace.length !== overrun.length) break
			}

			continue
		}

		if (node.type === `space`) {
			after = node.value + after
			measured.unshift([node.sourceIndex, node.sourceEndIndex])

			continue
		}

		break
	}

	return { after, measured }
}
