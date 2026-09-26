import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, SPACE_OR_TAB } from "../../regexps.ts"
import { fixDisabledRanges } from "../../utils/fixDisabledOnLine/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../../utils/neighborSettings/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"

/** The rule that trims the spaces and tabs ending a line, a line of nothing but them included. */
const NO_EOL_WHITESPACE: NeighborRuleSetting = {
	name: `no-eol-whitespace`,
	options: [true],
}

/**
 * Asks whether `no-eol-whitespace` empties the lines of nothing but spaces and tabs in the same run: a copy whose fix is on, which does not pass such lines over with `ignore: empty-lines`, and which no disable comment keeps off any line of the file, since a run is written with no line to ask. Such a line is then empty once the run is over, and is counted and written as one whichever side of that rule this one is listed.
 * @param root - The stylesheet.
 * @param result - The Stylelint result, which holds the configuration.
 * @returns True where it does.
 */
export function blankLinesGo (root: Root, result: PostcssResult): boolean {
	return neighborCopies(root, result, NO_EOL_WHITESPACE).some(({ fixDisabled, secondary, name }) => !fixDisabled && !optionsMatches(secondary, `ignore`, `empty-lines`) && fixDisabledRanges(result, name).length === 0)
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
