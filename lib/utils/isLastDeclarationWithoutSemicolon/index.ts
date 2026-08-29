import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"

/**
 * Asks whether a declaration is the one its block ends on without a semicolon — the declaration none of the `declaration-block-semicolon-*` rules has anything to say about, since there is no semicolon to stand in front of or behind.
 *
 * PostCSS keeps the answer in the block's `raws.semicolon`, which speaks of the last node of the block that is not a comment.
 * @param decl - The declaration to ask about.
 * @returns True where the declaration closes its block with no semicolon behind it.
 */
export function isLastDeclarationWithoutSemicolon (decl: import("postcss").Declaration): boolean {
	let parent = decl.parent

	if (!parent || parent.raws.semicolon) return false

	return lastNonCommentNode(parent) === decl
}
