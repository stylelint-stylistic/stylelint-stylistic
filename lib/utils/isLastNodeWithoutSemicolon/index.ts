import type { AtRule, Declaration } from "postcss"

import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"

/**
 * Asks whether a node is the one its container ends on without a semicolon — the declaration none of the `declaration-block-semicolon-*` rules has anything to say about, and the bodiless at-rule `at-rule-semicolon-space-before` has none either, since there is no semicolon to stand in front of or behind. The container is a block wherever the node stands in one and the root of a stylesheet or of an inline `style` attribute where it does not, and the question is the same in all of them.
 *
 * PostCSS keeps the answer in that container's `raws.semicolon`, which speaks of the last node of it that is not a comment.
 *
 * For a bodiless at-rule the answer runs both ways: one the answer is yes for spells no semicolon, and one the answer is no for spells one. That follows from the parser, which ends such an at-rule on a semicolon, on the brace closing its container or on the end of the file, the last two making it the node that container ends on. A comment written behind a semicolon-less one never becomes a sibling of it — the parser files it into the at-rule itself or into the container's own raw, by the syntax and by which of the two spellings the comment is written in — so an at-rule that does have a sibling has a semicolon of its own between the two.
 *
 * Only the yes half is claimed of a declaration: a Sass nested property carries a block of its own and ends on that block's brace, so a declaration the answer is no for need spell no semicolon either.
 * @param node - The declaration or bodiless at-rule to ask about.
 * @returns True where the node is the one its container ends on and no semicolon stands behind it.
 */
export function isLastNodeWithoutSemicolon (node: AtRule | Declaration): boolean {
	let parent = node.parent

	if (!parent || parent.raws.semicolon) return false

	return lastNonCommentNode(parent) === node
}
