import type { AtRule, Declaration } from "postcss"

import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"

/**
 * Asks whether a node is the one its container ends on without a semicolon: the declaration no `declaration-block-semicolon-*` rule speaks of, or the bodiless at-rule `at-rule-semicolon-space-before` has nothing to say about. PostCSS keeps the answer in the container's `raws.semicolon`, which speaks of its last non-comment node.
 *
 * For a bodiless at-rule the answer runs both ways, since a comment behind a semicolon-less one never becomes its sibling: the parser files it into the at-rule or the container's raw. Only the yes half is claimed of a declaration: a Sass nested property ends on its own block's brace and spells no semicolon either.
 * @param node - The declaration or bodiless at-rule.
 * @returns True where the node ends its container with no semicolon behind it.
 */
export function isLastNodeWithoutSemicolon (node: AtRule | Declaration): boolean {
	let parent = node.parent

	if (!parent || parent.raws.semicolon) return false

	return lastNonCommentNode(parent) === node
}
