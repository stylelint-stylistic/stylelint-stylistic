import type { Node } from "postcss"
import stylelint, { type Problem } from "stylelint"

import { isRoot } from "../typeGuards/index.ts"

/**
 * Asks whether a node holds a place in the file: a start, and the input it counts in.
 * @param node - The node.
 * @returns True where it does.
 */
function holdsAPlace (node: Node): boolean {
	return Boolean(node.source?.start && node.source.input)
}

/**
 * The node a problem is placed on: the node itself where it holds a place in the file, and otherwise the nearest node in front of it in its block that does, or its container's, outwards; a root takes no neighbor.
 * @param node - The node reported on.
 * @returns That node, or nothing where none holds a place.
 */
function placedNode (node: Node): Node | undefined {
	for (let held: Node | undefined = node; held; held = held.parent) {
		if (holdsAPlace(held)) return held

		// A root's neighbor is another stylesheet of the document
		if (isRoot(held)) continue

		for (let sibling = held.prev(); sibling; sibling = sibling.prev()) {
			if (holdsAPlace(sibling)) return sibling
		}
	}

	return undefined
}

/**
 * Reports a problem through Stylelint, on a node that holds a place in the file.
 *
 * A node another rule built, as `rule.append({ prop, value })` builds one, carries no `source`, and Stylelint's `report` reads the problem's position off it first thing: the whole lint threw, and no rule read the file any further. Such a node is reported on the nearest node in front of it in its block that holds a place, or on its container where none does, with no position inside it, since an index counts characters of a text the file does not hold. The node in front comes first so that a `stylelint-disable` comment standing there covers the built node, as it covers what the file holds behind it; a `stylelint-disable-next-line` comment names a line the built node does not stand on, and covers it only where the node reported on stands on that line. The fix is handed over as it is. A problem with no such node at all is dropped.
 * @param problem - The problem.
 */
export function report (problem: Problem): void {
	let placed = placedNode(problem.node)

	if (placed === problem.node) {
		stylelint.utils.report(problem)

		return
	}

	if (!placed) return

	let { ruleName, result, message, messageArgs, severity, fix } = problem

	stylelint.utils.report({ ruleName, result, message, node: placed, ...(messageArgs && { messageArgs }), ...(severity !== undefined && { severity }), ...(fix && { fix }) })
}
