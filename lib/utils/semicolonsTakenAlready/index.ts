import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { CLOSES_NOTHING_IN_FRONT, TRAILING_CSS_WHITESPACE, TRAILING_SEMICOLON } from "../../regexps.ts"
import { closingOffset } from "../closingOffset/index.ts"
import { nodeString } from "../nodeString/index.ts"
import { isComment } from "../typeGuards/index.ts"

/**
 * Finds the semicolons of a raw's text in the file that a rule listed earlier has already taken out of the raw: walking back from the raw's end, a semicolon the file spells and the raw no longer holds, and past the raw's start the semicolons up to what stands in front of it, which the raw held at its head. The walk stops where the two part otherwise, since another write changed the raw there.
 * @param text - The root's text.
 * @param raw - The raw as it stands.
 * @param end - Where the raw ends in the text.
 * @param start - Where what stands in front of the raw ends in the text.
 * @param into - Takes the semicolons' offsets.
 */
function takenAlready (text: string, raw: string, end: number, start: number, into: Set<number>): void {
	let index = end - 1
	let rawIndex = raw.length - 1

	for (; index >= start && rawIndex >= 0; index -= 1) {
		if (text.charAt(index) === raw.charAt(rawIndex)) rawIndex -= 1
		else if (text.charAt(index) === `;`) into.add(index)
		else return
	}

	let head: number[] = []

	for (; index >= start && text.charAt(index) === `;`; index -= 1) head.push(index)

	// A semicolon against the code in front closes that code rather than standing in the raw
	if (head.length > 0 && index >= 0 && !CLOSES_NOTHING_IN_FRONT.test(text.charAt(index))) head.pop()

	for (let semicolon of head) into.add(semicolon)
}

/**
 * Finds where a node ends in its root's text, behind the stray semicolon PostCSS files behind a rule: the farther of the parser's end and the end of the node's print, 0 for no node.
 * @param node - The node.
 * @param rootStart - The root's offset.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offset.
 */
function endIn (node: Node | undefined, rootStart: number, result: PostcssResult): number {
	if (!node) return 0

	let end = `nodes` in node ? closingOffset(node) : node.source?.end?.offset
	let start = node.source?.start?.offset
	// `postcss-less` ends an inline comment one character short, and the print reaches its end
	let printed = start === undefined ? 0 : start + nodeString(node, result).length

	return Math.max(end ?? 0, printed) - rootStart
}

/**
 * Finds the text a rule listed earlier moved into the node closing a block from behind it: `declaration-block-trailing-semicolon: never` writes the comments behind a custom property or a bodiless at-rule, with the runs around them, into the node, where it takes the semicolon PostCSS writes behind such a node. Where the print spells the node as the file does, less that semicolon and the run in front of it, and goes on past it, what it holds past the part both spell is that text, standing in front of the block's tail.
 * @param node - The block's last node.
 * @param text - The root's text.
 * @param rootStart - The root's offset.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The moved text and where it opens in the root's text, or nothing where nothing was moved.
 */
function movedIn (node: Node | undefined, text: string, rootStart: number, result: PostcssResult): { tail: string, start: number } | undefined {
	let start = node?.source?.start?.offset

	if (!node || start === undefined || isComment(node) || `nodes` in node) return undefined

	let printed = nodeString(node, result)
	let from = start - rootStart
	let common = 0

	while (common < printed.length && printed[common] === text[from + common]) common += 1

	// The node itself as the file spells it, less the flag's semicolon and the run in front of it, which that rule takes; a print parting from the file inside it was changed otherwise, as PostCSS's escape of `<!--` changes it, and nothing was moved
	let end = node.source?.end?.offset
	let spelled = end === undefined ? `` : text.slice(from, end - rootStart).replace(TRAILING_SEMICOLON, ``).replace(TRAILING_CSS_WHITESPACE, ``)

	if (common === printed.length || common < spelled.length) return undefined

	return { tail: printed.slice(common), start: from + common }
}

/**
 * Finds the offsets of the stray semicolons rules listed earlier have taken out of the raws `no-extra-semicolons` reads, which the file still spells.
 * @param root - The stylesheet.
 * @param text - Its text.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The offsets.
 */
export function semicolonsTakenAlready (root: Root, text: string, result: PostcssResult): Set<number> {
	let offsets: Set<number> = new Set()
	let rootStart = root.source?.start?.offset ?? 0

	root.walk((node) => {
		let start = node.source?.start?.offset

		if (typeof node.raws.before === `string` && start !== undefined) takenAlready(text, node.raws.before, start - rootStart, endIn(node.prev(), rootStart, result), offsets)

		let end = `nodes` in node ? closingOffset(node) : undefined

		if (end === undefined) return

		let own = String(node.raws.ownSemicolon ?? ``)
		let brace = end - rootStart - own.length

		if (own) takenAlready(text, own, end - rootStart, brace, offsets)
		if (typeof node.raws.after !== `string`) return

		let moved = movedIn((node as Container).last, text, rootStart, result)

		if (moved) takenAlready(text, moved.tail + node.raws.after, brace - 1, moved.start, offsets)
		else takenAlready(text, node.raws.after, brace - 1, endIn((node as Container).last, rootStart, result), offsets)
	})

	if (typeof root.raws.after === `string`) {
		// A root's tail ends where its text does, an embedded one's too, which holds the moved text as a block does
		let moved = movedIn(root.last, text, rootStart, result)

		if (moved) takenAlready(text, moved.tail + root.raws.after, text.length, moved.start, offsets)
		else if (!root.parent) takenAlready(text, root.raws.after, text.length, endIn(root.last, rootStart, result), offsets)
	}

	return offsets
}
