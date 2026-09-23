import type { ChildNode, Container, Node } from "postcss"
import type { PostcssResult } from "stylelint"

import { INLINE_COMMENT_BREAK } from "../../../regexps.ts"
import { isComment } from "../../../utils/typeGuards/index.ts"
import { closingSemicolonIsCommentText } from "../closingSemicolonIsCommentText/index.ts"

/**
 * Asks whether the `//` comment a semicolon of its text closed a node in runs on right behind a node.
 *
 * It does behind that node, and behind a comment `postcss-less` carved out of its text: one whose whole `raws.before` is the comment's and whose text holds no break. Behind a carved `//` comment the break closing both opens the raw behind, so the head there is empty.
 * @param node - The node asked about.
 * @param result - The Stylelint result, whose syntax says what opens a comment.
 * @returns True where it does.
 */
function runsOnBehind (node: ChildNode, result: PostcssResult): boolean {
	if (!isComment(node)) return closingSemicolonIsCommentText(node, result)

	let before = node.raws.before ?? ``

	return commentTextHead(node, `before`, result) === before && !INLINE_COMMENT_BREAK.test(`${node.raws.left ?? ``}${node.text}${node.raws.right ?? ``}`)
}

/**
 * Reads the head of a node's `raws.before`, or of a block's `raws.after`, that is the text of a `//` comment behind a node the parser closed on a semicolon of that text ([#720](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/720)).
 *
 * Less reads the comment on to the first line feed or carriage return, so the head is the raw up to it, or the whole raw where it holds none.
 * @param owner - The node whose `raws.before` is read, or the container whose `raws.after` is.
 * @param key - Which of the two raws.
 * @param result - The Stylelint result, whose syntax says what opens a comment.
 * @returns The head, empty where the break opens the raw, or null where no such comment runs into it.
 */
export function commentTextHead (owner: Node, key: `before` | `after`, result: PostcssResult): string | null {
	let anchor = key === `before` ? (owner as ChildNode).prev() : (owner as Container).last

	if (!anchor || !runsOnBehind(anchor, result)) return null

	let raw = owner.raws[key]

	if (typeof raw !== `string`) return null

	let lineBreak = raw.search(INLINE_COMMENT_BREAK)

	return lineBreak === -1 ? raw : raw.slice(0, lineBreak)
}
