import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { CLOSES_NOTHING_IN_FRONT } from "../../regexps.ts"
import { closingOffset } from "../closingOffset/index.ts"
import { nodeString } from "../nodeString/index.ts"

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
		if (typeof node.raws.after === `string`) takenAlready(text, node.raws.after, brace - 1, endIn((node as Container).last, rootStart, result), offsets)
	})

	if (typeof root.raws.after === `string` && !root.parent) takenAlready(text, root.raws.after, text.length, endIn(root.last, rootStart, result), offsets)

	return offsets
}
