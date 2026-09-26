import type { Node, Root } from "postcss"

import { EVERY_LINE_BREAK, LEADING_BYTE_ORDER_MARK } from "../../regexps.ts"

import { type PrintEscape, textIndex } from "./printEscapes.ts"

/** A place both the print and the text hold: where a node opens or ends in each, or where both open or end. */
type Anchor = { print: number, text: number }

/** Where each node's own first piece opens in the print, and where its last ends. */
export type NodePlaces = { starts: Map<Node, number>, ends: Map<Node, number> }

/**
 * Lines the print up with the text by the nodes both hold: where each node opens and ends in the print, and where the parser read it open and end in the text, in order of the print, a place out of order in the text left out; the starts and ends of both close the list.
 * @param places - Where each node opens and ends in the print.
 * @param rootStart - Where the root's text opens in the file, less what it prints in front of that.
 * @param print - The print.
 * @param text - The text.
 * @returns The anchors, in order.
 */
export function anchorsOf (places: NodePlaces, rootStart: number, print: string, text: string): Anchor[] {
	let known: Anchor[] = []

	for (let [node, at] of places.starts) {
		let offset = node.source?.start?.offset

		if (offset !== undefined) known.push({ print: at, text: offset - rootStart })

		// The parser's end, behind a declaration's semicolon and a stray one PostCSS files behind a rule, as the print's is; the print of a node a rule listed earlier wrote tells nothing of the file
		let end = places.ends.get(node)
		let endOffset = node.source?.end?.offset

		if (end !== undefined && endOffset !== undefined) known.push({ print: end, text: endOffset - rootStart })
	}

	let anchors: Anchor[] = [{ print: 0, text: 0 }]

	for (let anchor of known.toSorted((a, b) => a.print - b.print)) {
		let last = anchors.at(-1) as Anchor

		if (anchor.print >= last.print && anchor.text >= last.text && anchor.text <= text.length) anchors.push(anchor)
	}

	anchors.push({ print: print.length, text: text.length })

	return anchors
}

/**
 * Finds the first anchor from a place of the print on.
 * @param anchors - The anchors, in order.
 * @param index - The place.
 * @returns The anchor's place in the list.
 */
function nextAnchor (anchors: Anchor[], index: number): number {
	let low = 0
	let high = anchors.length - 1

	while (low < high) {
		let middle = Math.floor((low + high) / 2)

		if ((anchors[middle] as Anchor).print < index) low = middle + 1
		else high = middle
	}

	return low
}

/**
 * Counts the characters two texts open with alike.
 * @param a - One text.
 * @param b - The other.
 * @returns The count.
 */
function commonHead (a: string, b: string): number {
	let count = 0

	while (count < a.length && count < b.length && a[count] === b[count]) count += 1

	return count
}

/**
 * Counts the characters two texts end with alike, up to a bound.
 * @param a - One text.
 * @param b - The other.
 * @param bound - The most to count.
 * @returns The count.
 */
function commonTail (a: string, b: string, bound: number): number {
	let count = 0

	while (count < bound && a[a.length - 1 - count] === b[b.length - 1 - count]) count += 1

	return count
}

/**
 * Moves a break of the print a rule listed earlier wrote into the text, where the warning about it is placed, by the places both hold on either side of it. Where the break stands in what the print and the text between those places open or end with alike, it keeps its distance to that side. Otherwise, where the print holds as many breaks between them as the text, it is the text's one of the same rank; else it is found back from the next place, past as many breaks of the text as the print holds from the break on. Where the text holds fewer, it keeps its distance to the next place. So the warning stands on the line of the file the empty line is on however many lines that rule took out or wrote around it.
 * @param anchors - The places both hold.
 * @param print - The print.
 * @param text - The text.
 * @param index - The break's offset in the print.
 * @returns Its offset in the text.
 */
export function placeInText (anchors: Anchor[], print: string, text: string, index: number): number {
	let next = nextAnchor(anchors, index)
	let anchor = anchors[next] as Anchor
	let front = anchors[next - 1] ?? { print: 0, text: 0 }
	let printed = print.slice(front.print, anchor.print)
	let read = front.text <= anchor.text ? text.slice(front.text, anchor.text) : ``
	let head = commonHead(printed, read)

	if (index - front.print < head) return front.text + (index - front.print)

	if (anchor.print - index <= commonTail(printed, read, Math.min(printed.length, read.length) - head)) return anchor.text - (anchor.print - index)

	let window = [...read.matchAll(EVERY_LINE_BREAK)]
	let inFront = (print.slice(front.print, index).match(EVERY_LINE_BREAK) ?? []).length
	let behind = (print.slice(index, anchor.print).match(EVERY_LINE_BREAK) ?? []).length
	let found = inFront + behind === window.length ? window[inFront] : window.at(-behind)

	if (behind === 0 || !found) return Math.max(0, anchor.text - (anchor.print - index))

	return front.text + found.index
}

/**
 * Carries the offsets of the print the empty lines are counted in into the file, where a warning is placed and where Stylelint reads its line and whether a disable comment covers it: past the escapes where the print parts from the file only there, else by the nodes both hold where a rule listed earlier wrote the print. The document an embedded root is placed in, which the offsets count in, holds a byte-order mark the root's text leaves out and its print keeps.
 * @param root - The root.
 * @param counted - The print, and where each node opens and ends in it.
 * @param counted.text - The print.
 * @param counted.places - Where each node opens and ends in it, if told.
 * @param escapes - The print's escapes, or nothing where it parts from the file otherwise.
 * @returns The carrier.
 */
export function placeOfWarnings (root: Root, counted: { text: string, places?: NodePlaces }, escapes: PrintEscape[] | undefined): (index: number) => number {
	let parsed = root.source?.input.css ?? counted.text
	let mark = LEADING_BYTE_ORDER_MARK.test(counted.text) && !LEADING_BYTE_ORDER_MARK.test(parsed) ? counted.text.charAt(0) : ``
	let text = `${mark}${parsed}`
	let anchors = escapes !== undefined || !counted.places || counted.text === text ? undefined : anchorsOf(counted.places, (root.source?.start?.offset ?? 0) - mark.length, counted.text, text)

	return (index) => (anchors ? placeInText(anchors, counted.text, text, index) : textIndex(index, escapes))
}
