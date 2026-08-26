import { TRAILING_WHITESPACE } from "../../regexps.js"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.js"

/** @typedef {import('postcss').Container} Container */

/**
 * Sets the block's final raw, in the raw the parser filed it in — which is the one {@link lastNodeHoldsTheBlockAfter} names and `getBlockAfter` reads back.
 *
 * Where the node closing the block has swallowed that run, the write lands inside that node's `raws.between` and the text in front of the run stays exactly where it stands — a comment the at-rule swallowed along with the whitespace among it. The run is left there rather than handed over to the block: the two spell the same file, and moving it would take it out from under `declaration-block-trailing-semicolon`, whose own fix reads `raws.between` for it.
 * @param {Container} statement - The statement carrying the block.
 * @param {string} after - The run to write in its place.
 * @returns {Container} The statement that was passed in.
 */
export function setBlockAfter (statement, after) {
	if (!lastNodeHoldsTheBlockAfter(statement)) {
		statement.raws.after = after

		return statement
	}

	let last = statement.last

	last.raws.between = (last.raws.between ?? ``).replace(TRAILING_WHITESPACE, ``) + after

	return statement
}
