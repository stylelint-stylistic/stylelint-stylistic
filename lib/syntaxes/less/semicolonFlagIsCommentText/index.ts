import type { Node } from "postcss"
import type { AtRule } from "postcss-less"
import type { PostcssResult } from "stylelint"

import { inlineCommentReading } from "../../../preprocessor/readsInlineComments/index.ts"
import { writesIntoInlineComment } from "../../../preprocessor/writesIntoInlineComment/index.ts"
import { isCustomProperty } from "../../../utils/isCustomProperty/index.ts"
import { isAtRule, isDeclaration } from "../../../utils/typeGuards/index.ts"
import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.ts"
import { LESS_DETACHED_RULESET_NAME } from "../regexps.ts"

/**
 * Asks whether Less reads a `//` comment behind the node as a comment whatever the node spells.
 *
 * A declaration of an ordinary property and a call to a mixin or a detached ruleset are read with the reader that skips such a comment, the call's name spelled as Less reads one, so a semicolon in its text closes nothing or the file is refused. A custom property, a variable and any other at-rule fall back to a reader that knows no `//`, and which of the two Less takes turns on its expression grammar, so their flag is believed.
 * @param node - The node closing the block.
 * @returns True where the comment is one.
 */
function readsTheComment (node: Node): boolean {
	if (isDeclaration(node)) return !isCustomProperty(node.prop)

	return isAtRule(node) && (Boolean((node as AtRule).mixin) || (isLessDetachedRulesetCall(node) && LESS_DETACHED_RULESET_NAME.test(node.name)))
}

/**
 * Asks whether the semicolon a block's `raws.semicolon` stands for is the text of a `//` comment behind the node.
 *
 * `postcss-less` closes a node at the first semicolon behind it, one inside such a comment included ([#359](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/359)). The stringifier prints the flag's semicolon right behind the node's text, which is where an empty spelled run puts the guard's written character. A parser keeping no such comment in that text cut it out itself, so its flag is code.
 * @param node - The node closing the block.
 * @param result - The Stylelint result, whose syntax says what opens a comment.
 * @returns True where the flag is set by comment text.
 */
export function semicolonFlagIsCommentText (node: Node, result: PostcssResult): boolean {
	if (!node.parent?.raws.semicolon || !readsTheComment(node)) return false

	return inlineCommentReading(node, result).keeps && writesIntoInlineComment(node, result, ``)
}
