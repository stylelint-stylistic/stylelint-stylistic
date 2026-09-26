import type { AtRule, ChildNode, Declaration, Rule } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_BACKSLASHES } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { isAtRule, isComment, isDeclaration } from "../../utils/typeGuards/index.ts"

/**
 * Counts the backslashes a text ends on.
 * @param text - The text.
 * @returns The count.
 */
function trailingBackslashes (text: string): number {
	return text.length - text.replace(TRAILING_BACKSLASHES, ``).length
}

/**
 * Asks whether a character is escaped: an odd run of backslashes stands in front of it, counted on into the text in front of this one where the run opens this one.
 * @param text - The text.
 * @param index - The character's index in it.
 * @param lead - The backslashes the text in front ends on.
 * @returns True where it is.
 */
export function isEscaped (text: string, index: number, lead: number): boolean {
	let backslashes = trailingBackslashes(text.slice(0, index))

	return (backslashes === index ? backslashes + lead : backslashes) % 2 === 1
}

/**
 * Counts the backslashes a node's code ends on; none where it ends inside an inline comment, whose backslashes are text.
 * @param syntax - The syntax, which reads the comments.
 * @param node - The node the code is from.
 * @param code - The code.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @returns The count.
 */
function codeBackslashes (syntax: Syntax, node: ChildNode, code: string, result: PostcssResult): number {
	return syntax.endsWithInlineComment(code, syntax.inlineComments(node, result)) ? 0 : trailingBackslashes(code)
}

/**
 * Asks whether PostCSS prints a semicolon behind a statement: behind every one but the last of its container that is no comment, and behind that one where the container keeps its semicolon.
 * @param node - The statement.
 * @returns True where it does.
 */
function printsSemicolon (node: ChildNode): boolean {
	let { parent } = node

	if (!parent) return false

	if (parent.raws.semicolon) return true

	let nodes = parent.nodes ?? []
	let last = nodes.length - 1

	while (last > 0 && nodes[last]?.type === `comment`) last -= 1

	return parent.index(node) !== last
}

/**
 * Counts the backslashes the text in front of a raw ends on where a statement no semicolon closes stands there: a declaration's value or flag, a bodiless at-rule's params. A block, a comment or a semicolon ends on a character no backslash escapes.
 * @param syntax - The syntax, which reads the statement.
 * @param node - The node in front of the raw, if any.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @returns The count.
 */
export function backslashesBehindStatement (syntax: Syntax, node: ChildNode | undefined, result: PostcssResult): number {
	if (!node || isComment(node) || !(isDeclaration(node) || (isAtRule(node) && !node.nodes)) || printsSemicolon(node)) return 0

	let flag = node.raws.important

	if (typeof flag === `string`) return codeBackslashes(syntax, node, flag, result)

	return isDeclaration(node) && node.important ? 0 : codeBackslashes(syntax, node, syntax.read(node), result)
}

/**
 * Counts the backslashes the head in front of a statement's `raws.between` ends on: a property, a selector or an at-rule's params.
 * @param syntax - The syntax, which reads the head.
 * @param node - The statement.
 * @param result - The Stylelint result, which names the syntax the file was parsed with.
 * @returns The count.
 */
export function backslashesBehindHead (syntax: Syntax, node: AtRule | Declaration | Rule, result: PostcssResult): number {
	return codeBackslashes(syntax, node, isDeclaration(node) ? node.prop : syntax.read(node), result)
}
