import type { Node } from "postcss-value-parser"

import { isOnlyWhitespace } from "../isOnlyWhitespace/index.ts"

/**
 * Asks whether a call `opensAnAddress` names quotes its address: the parser hands the string back as the first node, and nothing but the tokenizer's whitespace stands between it and the `(`. The string is then the whole address, and what stands behind it is the arguments of a call, which Sass compiles and the rules walking a value read as those of any other call. The parser passes every code point up to a space over in front of the string, while PostCSS takes the parentheses of `url(` behind a vertical tab or another control character as one token and Sass and Less refuse the file, so such a call is passed over whole, as a bare address is.
 * @param valueNode - The call.
 * @param opening - What stands between the `(` and the string as the file spells it, where the value the call was parsed from is a copy with its comments blanked to spaces: a comment there is no whitespace to the CSS tokenizer, which reads a bad url token to the `)` whatever the name's spelling, so the string is no string to the compilers. The parse's own run by default.
 * @returns True where a string opens the parentheses.
 */
export function quotesItsAddress (valueNode: Node, opening?: string): boolean {
	return valueNode.type === `function` && valueNode.nodes[0]?.type === `string` && isOnlyWhitespace(opening ?? valueNode.before)
}
