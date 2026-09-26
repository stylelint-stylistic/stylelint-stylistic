import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE_AND_SEMICOLONS } from "../../regexps.ts"
import { endIn } from "../semicolonsTakenAlready/index.ts"
import { isComment } from "../typeGuards/index.ts"

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
 * Finds where a node ends in its root's text, read off the file: the parser's end, behind a declaration's semicolon and a stray one PostCSS files behind a rule. A rule listed earlier may have written the node, so its print tells nothing, but for a comment, whose end `postcss-less` counts one character short where it runs to the end of its line.
 * @param node - The node.
 * @param rootStart - The root's offset.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offset.
 */
function nodeEnd (node: Node, rootStart: number, result: PostcssResult): number {
	let end = node.source?.end?.offset

	return end === undefined || isComment(node) ? endIn(node, rootStart, result) : end - rootStart
}

/**
 * Finds where a container's closing brace stands in its root's text, read off the file: the parser's end is the brace's, or that of a stray semicolon PostCSS files behind it in `raws.ownSemicolon`, where nothing but whitespace and semicolons stand between the two. A rule listed earlier may have written that raw, so its length tells nothing.
 * @param node - The container.
 * @returns The offset of the brace, or nothing where the parser's end cannot be trusted.
 */
export function braceOffset (node: Node): number | undefined {
	let end = node.source?.end?.offset
	let { rootStart, text } = rootText(node)
	let last = `last` in node ? (node as Container).last : undefined

	// `postcss-less` counts the end of a container opened in front of a `//` comment it read with a new input in the shorter text
	if (end === undefined || (last?.source && last.source.input !== node.source?.input)) return undefined

	let brace = text.lastIndexOf(`}`, end - rootStart - 1)

	return brace >= 0 && text.slice(brace + 1, end - rootStart).replace(LEADING_CSS_WHITESPACE_AND_SEMICOLONS, ``) === `` ? brace : undefined
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

	let front = prev ? nodeEnd(prev, rootStart, result) : (parent?.type === `root` ? 0 : parent && bodyOffset(parent))

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

	let end = `nodes` in node && node.nodes ? bodyOffset(node as Container) : nodeEnd(node, rootStart, result)

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
	let front = node.last ? nodeEnd(node.last, rootStart, result) : bodyOffset(node)

	return brace === undefined || front === undefined ? undefined : [front, brace]
}

/**
 * Finds the span of a stray semicolon behind a block's closing brace, with the run in front of it.
 * @param node - The container.
 * @returns The span, or nothing where the file does not tell it.
 */
export function ownSemicolonSpan (node: Node): Span | undefined {
	let brace = braceOffset(node)
	let end = node.source?.end?.offset

	return brace === undefined || end === undefined ? undefined : [brace + 1, end - rootText(node).rootStart]
}

/**
 * Finds the span of a root's tail: from the end of its last node to the end of its text.
 * @param root - The root.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The span.
 */
export function tailSpan (root: Root, result: PostcssResult): Span {
	let { rootStart, text } = rootText(root)

	return [root.last ? nodeEnd(root.last, rootStart, result) : 0, text.length]
}
