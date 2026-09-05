import type { Node as ValueParserNode } from "postcss-value-parser"

import { LEADING_OPERATOR } from "../../../regexps.ts"
import { isScssVariable } from "../../../utils/isScssVariable/index.ts"

/** The calls Sass hands through as the plain CSS they are, a solidus beside them staying the separator the file spells. Measured against dart-sass 1.104: `var(--x)/2` and `env(safe-area-inset-top)/2` print as they stand, while `fn()/2`, `abs(-4)/2`, `max(4px, 2px)/2` and `2/round(1.5)` print a quotient and `rgb(0 0 0)/2` is refused as an operation on a colour — so every other call is read as one Sass may evaluate, which puts the doubt on the side that declines. */
const PLAIN_CSS_CALLS: Set<string> = new Set([`env`, `var`])

/**
 * Asks whether a node standing beside a solidus is one Sass computes with, so that the solidus is its division.
 *
 * A variable is one, `$a` and `ns.$a` alike and whichever sign stands in front of it — `-$a/2` and `2/-$a` both print a quotient. A call is one unless Sass hands it through as plain CSS, and a parenthesised group, which the parser hands over as a call with no name, is one too: `(4)/2` is a quotient. A number, a dimension, a keyword and a string are not: `4/2`, `4px/2px`, `a/b` and `"a"/2` all print as they stand.
 * @param node - The node, none where the solidus stands at the edge of the text.
 * @returns True where Sass divides by or into it.
 */
function isOperand (node: ValueParserNode | undefined): boolean {
	if (!node) return false

	if (node.type === `function`) return !PLAIN_CSS_CALLS.has(node.value.toLowerCase())

	if (node.type !== `word`) return false

	return isScssVariable(LEADING_OPERATOR.test(node.value.charAt(0)) ? node.value.slice(1) : node.value)
}

/**
 * Asks whether Sass reads a solidus standing between two nodes as its division operator rather than as the separator CSS spells there.
 *
 * Sass decides by the operands and not by the whitespace: `$a/2`, `$a / 2` and `$a /2` all print a quotient, and `4/2`, `4 / 2` and `4 /2` all print `4/2`. So a solidus with such an operand on either side is one the rules about the separator pass over under this namespace — writing beside it would be writing beside an operator — and every other solidus is read as the core reads it. The reading is Dart Sass's up to 2.0, which is to drop the operator outside `calc()` in favour of `math.div`; a file spelling `$a/2` will be refused there, and the namespace reads what the file spells today.
 * @param left - The node in front of the solidus, none where the solidus opens the text.
 * @param right - The node behind it, none where the solidus closes the text.
 * @returns True where Sass divides there.
 */
export function readsSlashAsOperator (left: ValueParserNode | undefined, right: ValueParserNode | undefined): boolean {
	return isOperand(left) || isOperand(right)
}
