import type { Comment, Node } from "postcss"

import { isInlineComment } from "../../../preprocessor/isInlineComment/index.ts"
import { hasBlock } from "../../../utils/hasBlock/index.ts"
import { isCustomProperty } from "../../../utils/isCustomProperty/index.ts"
import { isAtRule, isComment, isDeclaration } from "../../../utils/typeGuards/index.ts"

/**
 * Asks whether Sass refuses to part with the semicolon behind the node closing a block, where comments follow the node.
 *
 * Sass makes the semicolon optional behind the last node, and with nothing behind it the answer is no. A custom property's value runs on to the semicolon or the brace, comments included, so without the semicolon every comment behind it is its value: `--x: 1 // c` compiles to `--x: 1 // c ;`. Behind a bodiless at-rule a `//` comment stays a comment, while a block comment standing where the semicolon was is dropped from the output: `@include m` followed by one compiles without it. Measured with dart-sass.
 * @param node - The node whose trailing semicolon is asked about.
 * @returns True where the semicolon stays.
 */
export function requiresTrailingSemicolon (node: Node): boolean {
	if (hasBlock(node)) return false

	let behind: Comment[] = []

	for (let next = node.next(); next; next = next.next()) {
		if (!isComment(next)) return false

		behind.push(next)
	}

	if (behind.length === 0) return false

	if (isDeclaration(node)) return isCustomProperty(node.prop)

	return isAtRule(node) && behind.some((comment) => !isInlineComment(comment))
}
