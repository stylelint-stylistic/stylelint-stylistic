import type { Container, Node } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { CHARSET_AT_RULE_NAME } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/**
 * Asks whether `no-extra-semicolons` reads the raws of a node: it passes over an at-rule and a rule the syntax calls no standard one, and reads a `@charset` all the same, since the semicolons around it are the file's.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node.
 * @returns True where the rule reads it.
 */
export function readsTheRawsOf (syntax: Syntax, node: Node): boolean {
	if (isAtRule(node)) return syntax.isStandardAtRule(node) || CHARSET_AT_RULE_NAME.test(node.name)
	if (isRule(node)) return syntax.isStandardRule(node)

	return true
}

/**
 * Reads which semicolons of a raw are no extra ones where `postcss-less` closed the node in front on a semicolon of a `//` comment's text: those of the head that is more of that text, and the first behind the break closing it, which Less closes the node on.
 * @param syntax - The syntax the rule is built over.
 * @param owner - The node whose `raws.before` is read, or the container whose `raws.after` is.
 * @param key - Which of the two raws.
 * @param result - The Stylelint result.
 * @returns A test of a semicolon's index in the raw.
 */
export function noExtraUnderComment (syntax: Syntax, owner: Node, key: `before` | `after`, result: PostcssResult): (index: number) => boolean {
	let raw = owner.raws[key]
	let head = syntax.commentTextHead(owner, key, result)

	if (head === null || typeof raw !== `string`) return () => false

	let closing = raw.indexOf(`;`, head.length)

	return (index) => index < head.length || index === closing
}

/**
 * Finds the semicolons `no-extra-semicolons` takes out of a container's `raws.after`, the run in front of its closing brace.
 *
 * Every one is extra, but for those {@link noExtraUnderComment} reads as closing a node. The rule passes the raw over behind a last child that is an at-rule the syntax calls no standard one, a Less mixin call putting its own semicolon there, and in a container {@link readsTheRawsOf} passes over.
 * @param syntax - The syntax the rule is built over.
 * @param container - The container.
 * @param result - The Stylelint result.
 * @returns The semicolons' indices in the raw.
 */
export function extraSemicolonsAfter (syntax: Syntax, container: Node, result: PostcssResult): number[] {
	let after = container.raws.after

	if (typeof after !== `string` || after.trim().length === 0 || !readsTheRawsOf(syntax, container)) return []

	let last = `last` in container ? (container as Container).last : undefined

	if (last && isAtRule(last) && !readsTheRawsOf(syntax, last)) return []

	let readsAsNoExtra = noExtraUnderComment(syntax, container, `after`, result)
	let indices: number[] = []

	styleSearch({ source: after, target: `;` }, (match) => {
		if (!readsAsNoExtra(match.startIndex)) indices.push(match.startIndex)
	})

	return indices
}

/**
 * Finds the semicolons `no-extra-semicolons` takes out of a node's `raws.before`, the run in front of it.
 *
 * Every one is extra, but for those {@link noExtraUnderComment} reads as closing a node, and none where {@link readsTheRawsOf} passes the node over.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node.
 * @param result - The Stylelint result.
 * @returns The semicolons' indices in the raw.
 */
export function extraSemicolonsBefore (syntax: Syntax, node: Node, result: PostcssResult): number[] {
	let before = node.raws.before

	if (typeof before !== `string` || before.trim().length === 0 || !readsTheRawsOf(syntax, node)) return []

	let readsAsNoExtra = noExtraUnderComment(syntax, node, `before`, result)
	let indices: number[] = []

	styleSearch({ source: before, target: `;` }, (match) => {
		if (!readsAsNoExtra(match.startIndex)) indices.push(match.startIndex)
	})

	return indices
}

/**
 * Finds the semicolons `no-extra-semicolons` takes out of a node's `raws.ownSemicolon`, the run PostCSS files behind a rule's closing brace: every one, none where {@link readsTheRawsOf} passes the node over.
 * @param syntax - The syntax the rule is built over.
 * @param node - The node.
 * @returns The semicolons' indices in the raw.
 */
export function extraSemicolonsOwn (syntax: Syntax, node: Node): number[] {
	let own = node.raws.ownSemicolon

	if (typeof own !== `string` || !readsTheRawsOf(syntax, node)) return []

	let indices: number[] = []

	styleSearch({ source: own, target: `;` }, (match) => {
		indices.push(match.startIndex)
	})

	return indices
}
