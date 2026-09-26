import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, SPACE_OR_TAB } from "../../regexps.ts"
import { fixDisabledOnLine, fixDisabledRanges } from "../../utils/fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../../utils/neighborSettings/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { semicolonsTakenAlready } from "../../utils/semicolonsTakenAlready/index.ts"
import { straySemicolonOffsetsTaken } from "../../utils/straySemicolonsTaken/index.ts"

/** The rule that trims the spaces and tabs ending a line, a line of nothing but them included. */
const NO_EOL_WHITESPACE: NeighborRuleSetting = {
	name: `no-eol-whitespace`,
	options: [true],
}

/**
 * Asks whether `no-eol-whitespace` empties the lines of nothing but spaces and tabs in the same run: a copy whose fix is on, which does not pass such lines over with `ignore: empty-lines`, and which no disable comment keeps off such a line of the file, since a run is written with no line to ask. Such a line is then empty once the run is over, and is counted and written as one whichever side of that rule this one is listed. The lines are read as that rule reads them, on the root's text without the stray semicolons the neighbors take out.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where it does.
 */
export function blankLinesGo (root: Root, result: PostcssResult): boolean {
	let copies = neighborCopies(root, result, NO_EOL_WHITESPACE).filter(({ fixDisabled, secondary }) => !fixDisabled && !optionsMatches(secondary, `ignore`, `empty-lines`))

	if (copies.length === 0) return false

	if (copies.some(({ name }) => fixDisabledRanges(result, name).length === 0)) return true

	let lines = blankLines(root, result)

	return copies.some(({ name }) => !lines.some((line) => fixDisabledOnLine(result, name, line)))
}

/**
 * Reads the line of the file an offset of a root's text stands on.
 * @param root - The stylesheet.
 * @param offset - The offset in its text.
 * @returns The line, counted from one in the file.
 * @throws {Error} Where the offset stands past the text.
 */
function lineOf (root: Root, offset: number): number {
	let line = root.source?.input.fromOffset(offset)?.line

	if (line === undefined) throw new Error(`A space of the root's text must stand on a line of its input`)

	return line + (root.source?.start?.line ?? 1) - 1
}

/**
 * Finds the lines of the file holding nothing but spaces and tabs, the stray semicolons the neighbors take out left out, as `no-eol-whitespace` reads them.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns The lines, counted from one in the file.
 */
function blankLines (root: Root, result: PostcssResult): number[] {
	let text = root.source?.input.css ?? ``
	let taken = new Set([...straySemicolonOffsetsTaken(root, result), ...semicolonsTakenAlready(root, text, result)])

	return [...new Set(blankLineOffsets(text, taken).map((offset) => lineOf(root, offset)))]
}

/**
 * Finds the offsets of every space and tab on a line ending on a break that holds nothing else but the stray semicolons a neighbor takes out.
 * @param text - The text.
 * @param taken - The offsets of those semicolons.
 * @returns The offsets.
 */
export function blankLineOffsets (text: string, taken: Set<number>): number[] {
	let offsets: number[] = []
	// The text's first line counts from its start, which the caller reads as a line's where the text opens one
	let start = 0

	for (let { index, 0: lineBreak } of text.matchAll(EVERY_LINE_BREAK)) {
		offsets.push(...lineSpaces(text, start, index, taken))
		start = index + lineBreak.length
	}

	return offsets
}

/**
 * Finds the offsets of the spaces and tabs of one line, where it holds nothing else but the stray semicolons a neighbor takes out.
 * @param text - The text.
 * @param start - Where the line opens.
 * @param end - Where its break opens.
 * @param taken - The offsets of those semicolons.
 * @returns The offsets, none where the line holds anything else or nothing.
 */
function lineSpaces (text: string, start: number, end: number, taken: Set<number>): number[] {
	let spaces: number[] = []

	for (let offset = start; offset < end; offset += 1) {
		if (SPACE_OR_TAB.test(text.charAt(offset))) spaces.push(offset)
		else if (!taken.has(offset)) return []
	}

	return spaces
}
