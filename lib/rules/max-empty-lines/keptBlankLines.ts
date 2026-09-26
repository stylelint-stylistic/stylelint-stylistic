import type { Container, Node, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_KEPT_LINE_MASK, EVERY_LINE_BREAK, EVERY_SPACE_OR_TAB, KEPT_LINE_MASK, SPACE_OR_TAB, TRAILING_LINE_BREAK } from "../../regexps.ts"
import { opensALine } from "../../utils/opensALine/index.ts"
import { afterSpan, beforeSpan, type Span, tailSpan } from "../../utils/rawSpans/index.ts"
import { semicolonsTakenAlready } from "../../utils/semicolonsTakenAlready/index.ts"
import { straySemicolonOffsetsTaken, straySemicolonsTaken, straySemicolonsTakenBefore } from "../../utils/straySemicolonsTaken/index.ts"

import { type BlankLines, blankLinesRead, lineOf } from "./blankLines.ts"

/** What a space and a tab of a kept line are written as while the fix runs: characters of a line, which no run passes. */
const MASKS: Record<string, string> = { " ": `\uE000`, "\t": `\uE001` }

/** A raw holding lines the fix keeps: the node and which raw, and which of its lines, counted by the breaks in front of them. */
export type Mask = { node: Node, key: `before` | `after`, lines: number[] }

/**
 * Asks whether a line holds nothing but spaces and tabs, and one of them at least, a stray semicolon a neighbor takes out read as absent.
 * @param piece - The text the line stands in.
 * @param start - Where the line opens.
 * @param end - Where its break opens.
 * @param taken - The offsets of the semicolons, in the text or in a longer one.
 * @param base - Where the text opens in the one the offsets count in.
 * @returns True where it does.
 */
function isBlank (piece: string, start: number, end: number, taken: Set<number>, base: number): boolean {
	let spaces = 0

	for (let offset = start; offset < end; offset += 1) {
		if (SPACE_OR_TAB.test(piece.charAt(offset))) spaces += 1
		else if (!taken.has(base + offset)) return false
	}

	return spaces > 0
}

/**
 * Finds the lines of a piece of text that hold nothing but spaces and tabs: each line a break ends, the first only where the piece opens a line.
 * @param piece - The piece.
 * @param taken - The offsets of the stray semicolons a neighbor takes out, in the piece or in a longer text.
 * @param opensLine - Whether the piece opens a line.
 * @param base - Where the piece opens in the text the offsets count in.
 * @returns The lines, by the breaks in front of them, and where each opens in the piece.
 */
function blankLinesIn (piece: string, taken: Set<number>, opensLine: boolean, base = 0): { rank: number, start: number }[] {
	let lines: { rank: number, start: number }[] = []
	let start = 0

	for (let [rank, { index, 0: lineBreak }] of [...piece.matchAll(EVERY_LINE_BREAK)].entries()) {
		if ((rank > 0 || opensLine) && isBlank(piece, start, index, taken, base)) lines.push({ rank, start })

		start = index + lineBreak.length
	}

	return lines
}

/**
 * Finds the raws holding the lines of the file `no-eol-whitespace` keeps, which a run of empty lines must not pass: the run in front of each node, in front of each closing brace, and the root's tail, whose lines of spaces are matched to the file's in its span by rank. A raw a rule listed earlier wrote with other such lines than the file spells tells nothing, and neither does a kept line in any other text of a node.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @param kept - The lines of the file kept.
 * @returns The raws, or nothing where some kept line is not found in one, or where the file spells a character a kept space is written as while the fix runs.
 */
export function keptBlankLineMasks (root: Root, result: PostcssResult, kept: Set<number>): Mask[] | undefined {
	let text = root.source?.input.css ?? ``
	let takenInText = new Set([...straySemicolonOffsetsTaken(root, result), ...semicolonsTakenAlready(root, text, result)])
	let masks: Mask[] = []
	let keptLines = [...kept]
	let found = new Set<number>()

	// A file spelling the characters the fix writes kept spaces as would have them written back as spaces
	if (KEPT_LINE_MASK.test(text)) return undefined

	let matched = true

	/**
	 * Matches one raw's lines to the file's.
	 * @param node - The node whose raw it is.
	 * @param key - Which raw.
	 * @param span - Its span of the file, if told.
	 * @param taken - The stray semicolons of the raw a neighbor takes out.
	 */
	function match (node: Node, key: `before` | `after`, span: Span | undefined, taken: Set<number>): void {
		let raw = node.raws[key]

		if (typeof raw !== `string` || !span) return

		let [from, to] = span
		let first = lineOf(root, from)
		let last = lineOf(root, to)

		// A span holding no kept line is left as it stands
		if (!keptLines.some((line) => line >= first && line <= last)) return

		let opensLine = from === 0 ? opensALine(root) : TRAILING_LINE_BREAK.test(text.slice(from - 1, from))
		let inText = blankLinesIn(text.slice(from, to), takenInText, opensLine, from).map(({ start }) => lineOf(root, from + start))

		if (!inText.some((line) => kept.has(line))) return

		let inRaw = blankLinesIn(raw, taken, opensLine)

		if (inRaw.length !== inText.length) {
			matched = false

			return
		}

		for (let line of inText) if (kept.has(line)) found.add(line)

		masks.push({ node, key, lines: inRaw.filter((_, rank) => inText[rank] !== undefined && kept.has(inText[rank])).map(({ rank }) => rank) })
	}

	root.walk((node) => {
		match(node, `before`, beforeSpan(node, result), straySemicolonsTakenBefore(node, result))

		if (`nodes` in node && node.nodes) match(node, `after`, afterSpan(node as Container, result), straySemicolonsTaken(node as Container, result))
	})
	match(root, `after`, tailSpan(root, result), straySemicolonsTaken(root, result))

	return matched && [...kept].every((line) => found.has(line)) ? masks : undefined
}

/**
 * Writes the spaces and tabs of the kept lines as characters no run passes, for the fix to leave the lines as they stand.
 * @param masks - The raws and their lines.
 */
function maskKeptLines (masks: Mask[]): void {
	for (let { node, key, lines } of masks) {
		let raw = String(node.raws[key] ?? ``)
		let breaks = [...raw.matchAll(EVERY_LINE_BREAK)].map(([lineBreak]) => lineBreak)

		node.raws[key] = raw.split(EVERY_LINE_BREAK).map((piece, rank) => (lines.includes(rank) ? piece.replaceAll(EVERY_SPACE_OR_TAB, (character) => MASKS[character] ?? character) : piece) + (breaks[rank] ?? ``)).join(``)
	}
}

/**
 * Writes one node's masked spaces and tabs back.
 * @param node - The node.
 */
function unmask (node: Node): void {
	for (let [key, value] of Object.entries(node.raws)) if (typeof value === `string` && KEPT_LINE_MASK.test(value)) (node.raws as Record<string, unknown>)[key] = value.replaceAll(EVERY_KEPT_LINE_MASK, (character) => (character === MASKS[` `] ? ` ` : `\t`))
}

/**
 * Writes the masked spaces and tabs back into every raw of the tree, wherever the fix moved them.
 * @param root - The stylesheet.
 */
function unmaskKeptLines (root: Root): void {
	root.walk(unmask)
	unmask(root)
}

/**
 * Reads the lines of nothing but spaces and tabs: a line is empty once a live `no-eol-whitespace` has run, and counted and written as one; a line a disable comment keeps from it holds its spaces, and the fix leaves it standing where the raws holding such lines are found, else no such line is read empty.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns How that rule leaves them, the raws holding the kept ones, if found, and whether such lines are read empty.
 */
export function readBlankLines (root: Root, result: PostcssResult): { blankLines: BlankLines, masks: Mask[] | undefined, blankLinesTaken: boolean } {
	let blankLines = blankLinesRead(root, result)
	let masks = blankLines.kept.size > 0 ? keptBlankLineMasks(root, result, blankLines.kept) : []

	return { blankLines, masks, blankLinesTaken: blankLines.go && masks !== undefined }
}

/**
 * Runs a write of the tree with the kept lines masked, and writes them back behind it.
 * @param root - The stylesheet.
 * @param masks - The raws holding the kept lines, if found.
 * @param write - The write.
 */
export function keepingLines (root: Root, masks: Mask[] | undefined, write: () => unknown): void {
	if (!masks?.length) {
		write()

		return
	}

	maskKeptLines(masks)
	write()
	unmaskKeptLines(root)
}
