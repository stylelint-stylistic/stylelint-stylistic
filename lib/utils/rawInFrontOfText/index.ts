import type { Node } from "postcss"

import { runInFrontOf } from "../runInFrontOf/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/**
 * What the file holds in front of the text a rule reads off a node, which the parser filed away from that text.
 *
 * A delimiter opening the text has its run there and nowhere else, so a check reading only the text takes the head of it for the start of the file (1789593917). The raw is returned whole rather than trimmed to its whitespace: a comment or the colon ending it is what stands in front of the delimiter, and a reader walking back through it must meet that character rather than run past it.
 *
 * An at-rule keeps it in `raws.afterName`, a declaration in `raws.between`; anything else is asked of `runInFrontOf`. In front of a root's first statement `postcss-html` and `postcss-styled-syntax` put the host code up to the embedded stylesheet in the root's `raws.codeBefore`, and the whole of a `<style>` element's opening break lives there, so that raw comes first.
 * @param node - The node whose text is read.
 * @returns What stands in front of the text, empty where nothing does.
 */
export function rawInFrontOfText (node: Node): string {
	if (isAtRule(node)) return node.raws.afterName ?? ``

	if (isDeclaration(node)) return node.raws.between ?? ``

	let { parent } = node
	let codeBefore = parent?.type === `root` && parent.first === node ? (parent.raws.codeBefore ?? ``) : ``

	return codeBefore + runInFrontOf(node)
}
