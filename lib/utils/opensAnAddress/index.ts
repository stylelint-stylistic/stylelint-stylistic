import { HEX_ESCAPE_TERMINATOR, TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import { namesAnAddress } from "../namesAnAddress/index.ts"

/**
 * The name a call of a value parse was made by, as the file spells it, with the parts `postcss-value-parser` handed back separately put together again.
 *
 * CSS closes a hexadecimal escape with one whitespace character belonging to the escape rather than to the text, and that parser reads no escape: it takes the whitespace for a divider and hands `\75 rl(a)` back as a word, a space and a call named `rl`. So the name is gathered by walking back over every pair of one such closing character and a word ending in such an escape — `\61 \75 rl(` gathers to `\61 \75 rl`, which spells `aurl` and names no address, while `a \75 rl(` stops at the space behind `a`, the word in front of it ending in no escape and being a value of its own.
 * @param valueNode - The call.
 * @param index - Where the call stands among its siblings.
 * @param siblings - The nodes the call stands among.
 * @returns The name, escapes unresolved and in the case the file writes it.
 */
function readName (valueNode: import("postcss-value-parser").Node, index: number, siblings: import("postcss-value-parser").Node[]): string {
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
 * Asks whether a node of a value parse opens a `url()`, whichever of the spellings CSS gives that name the file is written in.
 *
 * A rule reading a value has to know an address from an ordinary call, since what an address holds is a URL and not a list of arguments: its commas, its units, its numbers and its colours are the address's own. The name is read here rather than matched against the four characters `url(`, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is — which is what Sass compiles all of them to, and what `lightningcss` reads in all of them.
 *
 * The reading cuts both ways, and the second way is the sharper one: the whitespace closing a hexadecimal escape belongs to the escape rather than to the text, so it welds the name to whatever stands in front of it. `\61 url(` names one call, `aurl`, and `lightningcss` compiles it to `aurl(…)`; the parser hands that call back named `url` alone, and a reader matching the four characters takes it for an address and passes over everything it holds.
 * @param valueNode - The node to ask about.
 * @param index - Where the node stands among its siblings.
 * @param siblings - The nodes the node stands among.
 * @returns True where the node is a call opening an address.
 */
export function opensAnAddress (valueNode: import("postcss-value-parser").Node, index: number, siblings: import("postcss-value-parser").Node[]): boolean {
	return valueNode.type === `function` && namesAnAddress(readName(valueNode, index, siblings))
}
