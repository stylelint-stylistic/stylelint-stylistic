import type { Node as ValueParserNode } from "postcss-value-parser"

import { LEADING_OPERATOR } from "../../../regexps.ts"
import { isScssVariable } from "../../../utils/isScssVariable/index.ts"

/** The calls Sass hands through as plain CSS, a solidus beside them a separator; every other call may be evaluated (dart-sass 1.104 prints `fn()/2` as a quotient). */
const PLAIN_CSS_CALLS: Set<string> = new Set([`env`, `var`])

/**
 * Asks whether a node beside a solidus is one Sass computes with.
 *
 * A variable is, whatever sign is in front; a call is unless Sass hands it through, and so is a parenthesised group, a nameless call to the parser; a number, a dimension, a keyword and a string are not.
 * @param node - The node, none at the text's edge.
 * @returns True where Sass divides by it.
 */
function isOperand (node: ValueParserNode | undefined): boolean {
	if (!node) return false

	if (node.type === `function`) return !PLAIN_CSS_CALLS.has(node.value.toLowerCase())

	if (node.type !== `word`) return false

	return isScssVariable(LEADING_OPERATOR.test(node.value.charAt(0)) ? node.value.slice(1) : node.value)
}

/**
 * Asks whether Sass reads a solidus between two nodes as division rather than CSS's separator.
 *
 * Sass decides by the operands, not the whitespace: `$a /2` is a quotient, `4 /2` is not. The separator rules pass over a solidus beside such an operand. Dart Sass 2.0 drops the operator outside `calc()` for `math.div`.
 * @param left - The node in front, if any.
 * @param right - The node behind, if any.
 * @returns True where Sass divides there.
 */
export function readsSlashAsOperator (left: ValueParserNode | undefined, right: ValueParserNode | undefined): boolean {
	return isOperand(left) || isOperand(right)
}
