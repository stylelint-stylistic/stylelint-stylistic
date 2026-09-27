import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"
import { readWhitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/**
 * Returns the run in front of the closing brace that a custom property closing the block without a semicolon keeps in its value, or behind its flag, and that the `always` write of `declaration-block-trailing-semicolon` hands to the block, so that the semicolon stands where it stands behind any other declaration. `no-multiple-whitespaces` and `value-list-max-empty-lines` read the value without this run, which is the block's whether that write comes or not ({@link runHeldInTheValue}).
 *
 * A whitespace-only value keeps its run, since the parser keeps that run in the value in front of a semicolon too, and so does a value a `//` comment ends, whose run is the break closing the comment.
 * @param syntax - The syntax reading the value.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @returns The run, empty where the node keeps none of the block's or is not the block's last node.
 */
export function runHeldForTheBlock (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let { parent } = node

	if (!isDeclaration(node) || !parent || !lastNodeHoldsTheBlockAfter(parent) || parent.last !== node || (!node.important && WHITESPACE_OR_NOTHING.test(syntax.read(node))) || syntax.writesIntoInlineComment(node, result)) return ``

	return readWhitespaceBeforeSemicolon(syntax, node, result)
}

/**
 * Returns the part of a declaration's value that is the run {@link runHeldForTheBlock} finds: the rules reading the value's text read the value without it, as they read an ordinary property's value, whose run the parser files in the block's `raws.after`.
 * @param syntax - The syntax reading the value.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns The run the value ends on, empty behind a flag, and where the value keeps none of the block's.
 */
export function runHeldInTheValue (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	return decl.important ? `` : runHeldForTheBlock(syntax, decl, result)
}
