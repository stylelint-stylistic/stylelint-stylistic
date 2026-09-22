import type { AtRule, Declaration } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"
import { lastNonCommentNode } from "../lastNonCommentNode/index.ts"

/**
 * Asks whether a node is closed by no semicolon of its own: the one its container ends on without one, which is the declaration no `declaration-block-semicolon-*` rule speaks of or the bodiless at-rule `at-rule-semicolon-space-before` has nothing to say about, and a Sass nested property wherever it stands, which its own block closes. PostCSS keeps the first answer in the container's `raws.semicolon`, which speaks of its last non-comment node.
 *
 * For a bodiless at-rule the answer runs both ways, since a comment behind a semicolon-less one never becomes its sibling: the parser files it into the at-rule or the container's raw. Only the yes half is claimed of a declaration. A nested property's block closes it in the middle of a block as at its end, and a semicolon spelled behind that block is the next node's raw or the block's tail, not the property's ([#437](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/437)).
 * @param node - The declaration or bodiless at-rule.
 * @returns True where no semicolon of the node's own closes it.
 */
export function isLastNodeWithoutSemicolon (node: AtRule | Declaration): boolean {
	if (hasBlock(node)) return true

	let parent = node.parent

	if (!parent || parent.raws.semicolon) return false

	return lastNonCommentNode(parent) === node
}
