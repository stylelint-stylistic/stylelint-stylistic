import type { Node } from "postcss-value-parser"

import { namesAnAddress } from "../namesAnAddress/index.ts"
import { readCallName } from "../readCallName/index.ts"

/**
 * Asks whether a node of a value parse opens a `url()` in any spelling, since a bare address's commas, units and numbers are its own. The name is read, not matched against `url(`: `u\rl(`, `\75 rl(` and `URL(` count, as Sass and `lightningcss` read them, and `\61 url(`, one call named `aurl` which the parser returns as `url`, does not.
 * @param valueNode - The value parser node asked about.
 * @param index - Its index among its siblings.
 * @param siblings - The nodes of the value the node stands among.
 * @returns True where the node opens an address.
 */
export function opensAnAddress (valueNode: Node, index: number, siblings: Node[]): boolean {
	return valueNode.type === `function` && namesAnAddress(readCallName(valueNode, index, siblings).name)
}
