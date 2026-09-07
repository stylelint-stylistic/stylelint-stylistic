import type { Node } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR, TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"

/**
 * The name of a call as the file spells it. The parser takes the whitespace closing a hexadecimal escape for a divider and returns `\75 rl(a)` as a word, a space and a call named `rl`; the walk back joins every such pair.
 * @param valueNode - The call.
 * @param index - Its index among its siblings.
 * @param siblings - The nodes of the value the call stands among.
 * @returns The name, escapes unresolved, in the file's case.
 */
function readName (valueNode: Node, index: number, siblings: Node[]): string {
	let name = valueNode.value

	for (let at = index - 1; at > 0; at -= 2) {
		let space = siblings[at]
		let word = siblings[at - 1]

		if (space?.type !== `space` || !HEX_ESCAPE_TERMINATOR.test(space.value)) break
		if (word?.type !== `word` || !TRAILING_HEX_ESCAPE.test(word.value)) break

		name = `${word.value}${space.value}${name}`
	}

	return name
}

/**
 * Asks whether a node of a value parse opens a `url()` in any spelling, since an address's commas, units and numbers are its own. The name is read, not matched against `url(`: `u\rl(`, `\75 rl(` and `URL(` count, as Sass and `lightningcss` read them, and `\61 url(`, one call named `aurl` which the parser returns as `url`, does not.
 * @param valueNode - The value parser node asked about.
 * @param index - Its index among its siblings.
 * @param siblings - The nodes of the value the node stands among.
 * @returns True where the node opens an address.
 */
export function opensAnAddress (valueNode: Node, index: number, siblings: Node[]): boolean {
	return valueNode.type === `function` && namesAnAddress(readName(valueNode, index, siblings))
}
