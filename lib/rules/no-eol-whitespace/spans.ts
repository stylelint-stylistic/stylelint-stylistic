import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { closingOffset } from "../../utils/closingOffset/index.ts"
import { endIn } from "../../utils/semicolonsTakenAlready/index.ts"

/** Where a span of a root's text opens and ends, relative to the root. */
export type Span = [number, number]

/**
 * Reads where a root's text opens in the file and what it is.
 * @param node - A node of the root.
 * @returns The offset and the text.
 */
function rootText (node: Node): { rootStart: number, text: string } {
	let root = node.root()

	return { rootStart: root.source?.start?.offset ?? 0, text: root.source?.input.css ?? `` }
}

/**
 * Finds where a container's closing brace stands in its root's text: in front of `raws.ownSemicolon` where PostCSS files a stray semicolon behind it.
 * @param node - The container.
 * @returns The offset of the brace, or nothing where the parser's end cannot be trusted.
 */
export function braceOffset (node: Node): number | undefined {
	let end = closingOffset(node)

	if (end === undefined) return undefined

	return end - rootText(node).rootStart - String(node.raws.ownSemicolon ?? ``).length - 1
}

/**
 * Finds where a block's body opens in its root's text, behind the opening brace: nothing but whitespace and stray semicolons stand between it and the first node, or the closing brace.
 * @param node - The container.
 * @returns The offset, or nothing where the file does not tell it.
 */
function bodyOffset (node: Container): number | undefined {
	let { rootStart, text } = rootText(node)
	let first = node.first?.source?.start?.offset
	let limit = first === undefined ? braceOffset(node) : first - rootStart

	if (limit === undefined) return undefined

	let brace = text.lastIndexOf(`{`, limit - 1)

	return brace < 0 ? undefined : brace + 1
}

/**
 * Finds the span of the run in front of a node: from the end of the node in front of it, else from its block's opening brace or the root's start, to the node.
 * @param node - The node.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The span, or nothing where the file does not tell it.
 */
export function beforeSpan (node: Node, result: PostcssResult): Span | undefined {
	let { rootStart } = rootText(node)
	let start = node.source?.start?.offset
	let prev = node.prev()
	let parent = node.parent as Container | undefined

	if (start === undefined) return undefined

	let front = prev ? endIn(prev, rootStart, result) : (parent?.type === `root` ? 0 : parent && bodyOffset(parent))

	return front === undefined ? undefined : [front, start - rootStart]
}

/**
 * Finds the span of a node's head: from where it opens to its block's opening brace, or to its end where it holds no block.
 * @param node - The node.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The span, or nothing where the file does not tell it.
 */
export function headSpan (node: Node, result: PostcssResult): Span | undefined {
	let { rootStart } = rootText(node)
	let start = node.source?.start?.offset

	if (start === undefined) return undefined

	let end = `nodes` in node && node.nodes ? bodyOffset(node as Container) : endIn(node, rootStart, result)

	return end === undefined ? undefined : [start - rootStart, end]
}

/**
 * Finds the span of the run in front of a block's closing brace: from the end of its last node, else from the opening brace.
 * @param node - The container.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The span, or nothing where the file does not tell it.
 */
export function afterSpan (node: Container, result: PostcssResult): Span | undefined {
	let { rootStart } = rootText(node)
	let brace = braceOffset(node)
	let front = node.last ? endIn(node.last, rootStart, result) : bodyOffset(node)

	return brace === undefined || front === undefined ? undefined : [front, brace]
}

/**
 * Finds the span of a stray semicolon behind a block's closing brace, with the run in front of it.
 * @param node - The container.
 * @returns The span, or nothing where the file does not tell it.
 */
export function ownSemicolonSpan (node: Node): Span | undefined {
	let brace = braceOffset(node)

	return brace === undefined ? undefined : [brace + 1, brace + 1 + String(node.raws.ownSemicolon ?? ``).length]
}

/**
 * Finds the span of a root's tail: from the end of its last node to the end of its text.
 * @param root - The root.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The span.
 */
export function tailSpan (root: Root, result: PostcssResult): Span {
	let { rootStart, text } = rootText(root)

	return [root.last ? endIn(root.last, rootStart, result) : 0, text.length]
}
