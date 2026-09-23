import type { ChildNode, Container, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { INLINE_COMMENT_BREAK, TRAILING_CSS_WHITESPACE } from "../../../regexps.ts"
import { hasBlock } from "../../../utils/hasBlock/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { lastNonCommentNode } from "../../../utils/lastNonCommentNode/index.ts"
import { nodeString } from "../../../utils/nodeString/index.ts"
import { isAtRule, isComment, isDeclaration } from "../../../utils/typeGuards/index.ts"
import { closingSemicolonIsCommentText } from "../closingSemicolonIsCommentText/index.ts"

/** The roots folded already. */
let folded: WeakSet<Root> = new WeakSet()

/**
 * Asks whether the stringifier prints a semicolon behind a child: behind a declaration or a bodiless at-rule, unless it is the block's last node that is no comment and `raws.semicolon` is unset. PostCSS also writes one behind such an at-rule or a custom property a comment follows, which a parse never leaves, since the parser keeps that comment in the node; a block printed otherwise is put back by {@link fold}.
 * @param child - The child.
 * @param container - Its block.
 * @returns True where a semicolon follows it.
 */
function printsSemicolonBehind (child: ChildNode, container: Container): boolean {
	if (!isDeclaration(child) && !(isAtRule(child) && !hasBlock(child))) return false

	return lastNonCommentNode(container) !== child || Boolean(container.raws.semicolon)
}

/**
 * Prints a child as its block prints it: the run in front, the node in the file's syntax and the semicolon behind.
 * @param child - The child.
 * @param container - Its block.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The text.
 */
function printed (child: ChildNode, container: Container, result: PostcssResult): string {
	return `${child.raws.before ?? ``}${nodeString(child, result)}${printsSemicolonBehind(child, container) ? `;` : ``}`
}

/**
 * Collects the siblings behind a node that stand wholly in the text of the `//` comment it was closed in: each with a `raws.before` of its own, neither that raw nor the node's print holding a break. The run in front of the brace a block's last node swallowed is the block's, and is left out of the question.
 * @param node - The node the comment was closed in.
 * @param container - Its block.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The siblings, in order.
 */
function commentTextRun (node: ChildNode, container: Container, result: PostcssResult): ChildNode[] {
	let run: ChildNode[] = []

	for (let next = node.next(); next; next = next.next()) {
		let text = printed(next, container, result)

		if (next === container.last && lastNodeHoldsTheBlockAfter(container)) text = text.replace(TRAILING_CSS_WHITESPACE, ``)

		if (typeof next.raws.before !== `string` || INLINE_COMMENT_BREAK.test(text)) break

		run.push(next)
	}

	return run
}

/**
 * Folds one run into the raw behind it, and puts the block back as it was where the print would differ.
 * @param node - The node the comment was closed in.
 * @param run - The siblings standing in the comment's text.
 * @param container - Their block.
 * @param result - The Stylelint result, which holds the file's syntax.
 */
function fold (node: ChildNode, run: ChildNode[], container: Container, result: PostcssResult): void {
	let before = nodeString(container, result)
	let text = run.map((child) => printed(child, container, result)).join(``)
	let behind = run.at(-1)?.next()
	let { after, semicolon } = container.raws
	let behindBefore = behind?.raws.before
	let index = container.index(node)

	for (let child of run) child.remove()

	if (behind) behind.raws.before = text + (behindBefore ?? ``)
	else container.raws.after = text + (after ?? ``)

	if (lastNonCommentNode(container) === node) container.raws.semicolon = true

	if (nodeString(container, result) === before) return

	container.insertAfter(index, run)

	if (after === undefined) delete container.raws.after
	else container.raws.after = after

	if (semicolon === undefined) delete container.raws.semicolon
	else container.raws.semicolon = semicolon

	if (!behind) return

	if (behindBefore === undefined) delete behind.raws.before
	else behind.raws.before = behindBefore
}

/**
 * Folds the nodes `postcss-less` reads out of the text of a `//` comment back into that text, so no rule reads them as code ([#723](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/723)).
 *
 * The parser closes a node at a semicolon inside such a comment and reads the rest of the line as nodes, which Less reads as the comment. Behind every node whose semicolon is comment text ({@link closingSemicolonIsCommentText}, the reading the semicolon rules ask too), the siblings up to the break are taken out and their print is written in front of the raw behind them, the next node's `raws.before` or the block's `raws.after`, which `commentTextHead` keeps the writers off; a run of comments alone is left, since no rule reads a comment as code. Behind a node whose semicolon only may be such text, a flagged custom property, a variable or `@extend`, Less may read the rest of the line as code, so nothing is folded there (1789263104). A block whose print would change is put back.
 * @param root - The stylesheet, folded once.
 * @param result - The Stylelint result, which holds the file's syntax.
 */
export function foldCommentTextNodes (root: Root, result: PostcssResult): void {
	if (folded.has(root)) return

	folded.add(root)

	let containers: Container[] = [root]

	root.walk((node) => {
		if (`nodes` in node && node.nodes) containers.push(node as Container)
	})

	for (let container of containers) {
		// A fold takes out siblings behind the node alone, so the walk goes on with the node behind the run
		for (let node of container.nodes ?? []) {
			if (!closingSemicolonIsCommentText(node, result)) continue

			let run = commentTextRun(node, container, result)

			if (run.some((child) => !isComment(child))) fold(node, run, container, result)
		}
	}
}
