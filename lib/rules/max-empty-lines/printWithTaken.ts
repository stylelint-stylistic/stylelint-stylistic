import type { Builder, Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { hasBlock } from "../../utils/hasBlock/index.ts"
import { straySemicolonsTaken, straySemicolonsTakenBefore, straySemicolonsTakenOwn } from "../../utils/straySemicolonsTaken/index.ts"

/**
 * Prints a root and places the stray semicolons the neighbors take out of its nodes' raws in the print itself, by where the stringifier writes those raws: a node's `raws.before` ends where the node's own first piece opens, the `raws.after` of a node carrying a block, a Sass nested property's too, where its closing brace does, and `raws.ownSemicolon` opens where it is written behind that brace. The root's own tail is the caller's, since a styled template's print runs on into host code behind it. A rule listed earlier may have written the tree, and the print no longer lines up with the file, where the offsets of the semicolons in the file would point at other characters.
 * @param root - The root.
 * @param result - The Stylelint result, which holds the configuration.
 * @param print - The stringifier, called with a builder.
 * @param keepsTheOpening - Whether the root's opening piece is printed.
 * @returns The print and the semicolons' offsets in it.
 */
export function printWithTaken (root: Root, result: PostcssResult, print: (root: Root, builder: Builder) => void, keepsTheOpening: boolean): { text: string, taken: Set<number> } {
	let text = ``
	let taken: Set<number> = new Set()
	let started: Set<Node> = new Set()

	/**
	 * Files the semicolons of one raw.
	 * @param indices - Their indices in the raw.
	 * @param rawStart - Where the raw opens in the print.
	 */
	function file (indices: Set<number>, rawStart: number): void {
		for (let index of indices) taken.add(rawStart + index)
	}

	print(root, (piece, node, type) => {
		if (node === root && type === `start` && !keepsTheOpening) return

		let at = text.length

		if (node && node !== root && !started.has(node)) {
			started.add(node)
			file(straySemicolonsTakenBefore(node, result), at - String(node.raws.before ?? ``).length)
		}

		if (node && type === `end` && piece === `}` && hasBlock(node)) file(straySemicolonsTaken(node as Container, result), at - String(node.raws.after ?? ``).length)

		if (node && type === `end` && piece !== `}`) file(straySemicolonsTakenOwn(node, result), at)

		text += piece
	})

	return { text, taken }
}
