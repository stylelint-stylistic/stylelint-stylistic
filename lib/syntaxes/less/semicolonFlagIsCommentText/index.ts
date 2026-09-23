import type { Declaration, Node } from "postcss"
import type { AtRule } from "postcss-less"
import type { PostcssResult } from "stylelint"

import { printedText } from "../../../preprocessor/printedText/index.ts"
import { inlineCommentReading } from "../../../preprocessor/readsInlineComments/index.ts"
import { writesIntoInlineComment } from "../../../preprocessor/writesIntoInlineComment/index.ts"
import { LEADING_CSS_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../../regexps.ts"
import { blankComments } from "../../../utils/blankComments/index.ts"
import { findCommentSpans, findStringSpans } from "../../../utils/findCommentSpans/index.ts"
import { isCustomProperty } from "../../../utils/isCustomProperty/index.ts"
import { isAtRule, isDeclaration } from "../../../utils/typeGuards/index.ts"
import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.ts"
import { LESS_CALL_OPENING, LESS_CUSTOM_PROPERTY_BARE_ENTITY, LESS_DETACHED_RULESET_NAME } from "../regexps.ts"

/**
 * Returns a custom property's value with its trailing `//` comment blanked out and the whitespace that stood beside it trimmed.
 * @param decl - The custom property.
 * @param result - The Stylelint result, whose syntax says what opens a comment.
 * @returns The value alone.
 */
function bareValue (decl: Declaration, result: PostcssResult): string {
	let value = printedText(decl)

	return blankComments(value, findCommentSpans(value, inlineCommentReading(decl, result))).replace(LEADING_CSS_WHITESPACE, ``).replace(TRAILING_CSS_WHITESPACE, ``)
}

/**
 * Asks whether a text is a call running to its own end: {@link LESS_CALL_OPENING}, then an argument list whose parentheses balance, nesting included — `f(g(x))` and `calc(var(--y))` among them, a shape {@link LESS_CUSTOM_PROPERTY_BARE_ENTITY} does not carry since a regular expression cannot balance parentheses of unbounded depth. A parenthesis inside a quoted argument, `f("(")`, is text of that string rather than code and does not count.
 * @param text - The text asked about.
 * @returns True where it is such a call.
 */
function isBalancedCall (text: string): boolean {
	let opening = text.match(LESS_CALL_OPENING)?.[0]

	if (!opening || !text.endsWith(`)`)) return false

	let stringEndsAt = new Map(findStringSpans(text).map((span) => [span.start, span.end]))
	let depth = 0
	let index = opening.length
	let end = text.length - 1

	while (index < end) {
		let stringEnd = stringEndsAt.get(index)

		if (stringEnd !== undefined) {
			index = stringEnd
			continue
		}

		if (text[index] === `(`) depth += 1
		else if (text[index] === `)`) {
			if (depth === 0) return false

			depth -= 1
		}

		index += 1
	}

	return depth === 0
}

/**
 * Asks whether Less reads a `//` comment behind the node as a comment whatever the node spells.
 *
 * A declaration of an ordinary property and a call to a mixin or a detached ruleset are read with the reader that skips such a comment, the call's name spelled as Less reads one, so a semicolon in its text closes nothing or the file is refused. A custom property's permissive reader parts the same way behind {@link LESS_CUSTOM_PROPERTY_BARE_ENTITY} or {@link isBalancedCall}, one entity its comment-and-entity loop consumes whole before it would ever fall back to a reader that knows no `//`; behind anything else — `pink !important`, a bare `(a)`, `a=b`, `1 / 2`, `{a}`, `[[a]]` — that loop cannot finish, so the flag is believed as it was before ([#722](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/722)). A variable and any other at-rule fall back to the reader with no `//` outright, and which of the two Less takes turns on its expression grammar, so their flag is believed too.
 * @param node - The node closing the block.
 * @param result - The Stylelint result, whose syntax says what opens a comment.
 * @returns True where the comment is one.
 */
function readsTheComment (node: Node, result: PostcssResult): boolean {
	if (isDeclaration(node)) {
		if (!isCustomProperty(node.prop)) return true

		let value = bareValue(node, result)

		return LESS_CUSTOM_PROPERTY_BARE_ENTITY.test(value) || isBalancedCall(value)
	}

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
	if (!node.parent?.raws.semicolon || !readsTheComment(node, result)) return false

	return inlineCommentReading(node, result).keeps && writesIntoInlineComment(node, result, ``)
}
