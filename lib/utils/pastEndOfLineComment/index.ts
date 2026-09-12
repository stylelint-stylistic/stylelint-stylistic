import type { ChildNode } from "postcss"

import { LINE_BREAK, NON_SPACE } from "../../regexps.ts"

/**
 * Steps over a comment standing at the end of the line a closing brace ends, which `block-closing-brace-newline-after` reads past and writes behind.
 *
 * One comment at most, and only where nothing but spaces stands between it and the brace — a tab or a break there makes the answer no — and the comment itself holds no line break.
 * @param node - The node standing behind the brace.
 * @returns That node, or the one behind the comment; nothing where the comment ends the block or the file.
 */
export function pastEndOfLineComment (node: ChildNode): ChildNode | undefined {
	let endsTheLine = node.type === `comment` && !NON_SPACE.test(node.raws.before || ``) && !LINE_BREAK.test(node.toString())

	return endsTheLine ? node.next() : node
}
