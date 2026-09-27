import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"
import { readWhitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/**
 * Returns the run in front of the closing brace that a custom property closing the block without a semicolon keeps in its value, or behind its flag, and that the `always` write of `declaration-block-trailing-semicolon` hands to the block, so that the semicolon stands where it stands behind any other declaration.
 *
 * A whitespace-only value keeps its run, since the parser keeps that run in the value in front of a semicolon too, and so does a value a `//` comment ends, whose run is the break closing the comment.
 * @param syntax - The syntax reading the value.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @returns The run, empty where the node keeps none of the block's.
 */
export function runHeldForTheBlock (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let { parent } = node

	if (!isDeclaration(node) || !parent || !lastNodeHoldsTheBlockAfter(parent) || (!node.important && WHITESPACE_OR_NOTHING.test(syntax.read(node))) || syntax.writesIntoInlineComment(node, result)) return ``

	return readWhitespaceBeforeSemicolon(syntax, node, result)
}
