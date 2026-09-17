import type { Node } from "postcss-value-parser"

import { isOnlyWhitespace } from "../isOnlyWhitespace/index.ts"

/**
 * Asks whether a call `opensAnAddress` names quotes its address: the parser hands the string back as the first node, and nothing but the tokenizer's whitespace stands between it and the `(`. The string is then the whole address, and what stands behind it is the arguments of a call, which Sass compiles and the rules walking a value read as those of any other call ([#560](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/560)). The parser passes every code point up to a space over in front of the string, while PostCSS takes the parentheses of `url(` behind a vertical tab or another control character as one token and Sass and Less refuse the file, so such a call is passed over whole, as a bare address is.
 * @param valueNode - The call.
 * @returns True where a string opens the parentheses.
 */
export function quotesItsAddress (valueNode: Node): boolean {
	return valueNode.type === `function` && valueNode.nodes[0]?.type === `string` && isOnlyWhitespace(valueNode.before)
}
