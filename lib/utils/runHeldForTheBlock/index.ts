import type { AtRule, Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_OR_NOTHING } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { betweenTailAfterColon } from "../betweenTailAfterColon/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"
import { readWhitespaceBeforeSemicolon } from "../whitespaceBeforeSemicolon/index.ts"

/**
 * Asks whether a declaration prints nothing but whitespace behind its colon, with no flag: the parser keeps such a run in the value in front of a semicolon too, so the run is the value itself. A colon rule's fix moves a comment opening a custom property's value onto the tail of `raws.between` within the pass, which the next parse gives back to the value, so the text is read across that tail.
 * @param syntax - The syntax reading the value.
 * @param decl - The declaration.
 * @param result - The Stylelint result.
 * @returns True where the text behind the colon is whitespace or nothing.
 */
export function printsOnlyWhitespaceBehindTheColon (syntax: Syntax, decl: Declaration, result: PostcssResult): boolean {
	return !decl.important && WHITESPACE_OR_NOTHING.test(betweenTailAfterColon(syntax, decl, result) + syntax.read(decl))
}

/**
 * Returns the run in front of the closing brace that a custom property closing the block without a semicolon keeps in its value, or behind its flag, and that the `always` write of `declaration-block-trailing-semicolon` hands to the block, so that the semicolon stands where it stands behind any other declaration. `no-multiple-whitespaces` and `value-list-max-empty-lines` read the value without this run, which is the block's whether that write comes or not ({@link runHeldInTheValue}).
 *
 * A value printing nothing but whitespace behind the colon ({@link printsOnlyWhitespaceBehindTheColon}) keeps its run, since the parser keeps that run in the value in front of a semicolon too, and so does a value a `//` comment ends, whose run is the break closing the comment.
 * @param syntax - The syntax reading the value.
 * @param node - The node closing the block.
 * @param result - The Stylelint result.
 * @returns The run, empty where the node keeps none of the block's or is not the block's last node.
 */
export function runHeldForTheBlock (syntax: Syntax, node: AtRule | Declaration, result: PostcssResult): string {
	let { parent } = node

	if (!isDeclaration(node) || !parent || !lastNodeHoldsTheBlockAfter(parent) || parent.last !== node || printsOnlyWhitespaceBehindTheColon(syntax, node, result) || syntax.writesIntoInlineComment(node, result)) return ``

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
