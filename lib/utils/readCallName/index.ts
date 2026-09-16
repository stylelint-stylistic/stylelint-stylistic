import type { Node } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR } from "../../regexps.ts"
import { endsInAnOpenHexEscape } from "../endsInAnOpenHexEscape/index.ts"

/** A call's name as the file spells it, and where it opens in the value. */
export type CallName = {
	name: string,
	sourceIndex: number,
}

/**
 * Reads the name of a call as the file spells it. The parser takes the whitespace closing a hexadecimal escape for a divider and returns `\75 rl(a)` as a word, a space and a call named `rl`; the walk back joins every such pair.
 * @param valueNode - The call.
 * @param index - Its index among its siblings.
 * @param siblings - The nodes of the value the call stands among.
 * @returns The name, escapes unresolved, in the file's case, and the index it opens at.
 */
export function readCallName (valueNode: Node, index: number, siblings: Node[]): CallName {
	let name = valueNode.value
	let { sourceIndex } = valueNode

	for (let at = index - 1; at > 0; at -= 2) {
		let space = siblings[at]
		let word = siblings[at - 1]

		if (space?.type !== `space` || !HEX_ESCAPE_TERMINATOR.test(space.value)) break
		if (word?.type !== `word` || !endsInAnOpenHexEscape(word.value)) break

		name = `${word.value}${space.value}${name}`
		sourceIndex = word.sourceIndex
	}

	return { name, sourceIndex }
}
