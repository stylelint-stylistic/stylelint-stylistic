import type { Node as PostcssNode } from "postcss"
import type { PostcssResult } from "stylelint"

import { WHITESPACE_WITHOUT_BREAK_ONLY } from "../../regexps.ts"
import { nextNonCommentNode } from "../nextNonCommentNode/index.ts"
import { runInFrontOf } from "../runInFrontOf/index.ts"
import { straySemicolonsTakenBefore, withoutTaken } from "../straySemicolonsTaken/index.ts"

/**
 * Gets the node whose leading run a rule about the break behind a semicolon judges, at or after a given node: the first comment that ends no line, else the first non-comment node.
 *
 * A comment ends the line of the node in front of it where the run in front of the comment, as the neighbors taking stray semicolons out of it leave it, holds no break and nothing but whitespace; such a comment is stepped over, so that one may close the line. The run in front of any other comment is the run behind the semicolon, past any end-of-line comment: a break of it is the one asked for, and a stray semicolon kept in it or a space in front of its break stands there whatever follows the comment, so the comment is the node judged, and written, as any node behind the semicolon is.
 * @param startNode - The starting node.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The node, or null where every node from the start is a comment ending a line.
 */
export function nodeBehindEndOfLineComments (startNode: PostcssNode | undefined, result: PostcssResult): PostcssNode | null {
	let judged: PostcssNode | undefined

	let nodeToCheck = nextNonCommentNode(startNode, (comment) => {
		if (!judged && !WHITESPACE_WITHOUT_BREAK_ONLY.test(withoutTaken(runInFrontOf(comment), straySemicolonsTakenBefore(comment, result)))) judged = comment
	})

	return judged ?? nodeToCheck
}
