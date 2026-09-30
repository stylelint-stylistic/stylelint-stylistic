import type { Root } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, LINE_BREAK, SPACE_OR_TAB, SPACE_TAB_OR_CARRIAGE_RETURN, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { bareAddressSpans } from "../../utils/bareAddressSpans/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { maskStrings } from "../../utils/maskStrings/index.ts"

import { isEscaped } from "./escapes.ts"
import type { FoundRuns, LineOf } from "./lines.ts"
import { maskTaken, TAKEN_MARK, trimKeepingTaken } from "./taken.ts"

export const WHITESPACES_TO_REJECT = new Set([` `, `\t`])

/** The break as a string, since `styleSearch` takes no pattern. */
export const LINE_BREAK_CHARACTERS = [`\n`]

/**
 * Trims trailing spaces and tabs.
 * @param str - The string.
 * @returns The trimmed string.
 */
export function fixString (str: string): string {
	return str.replace(TRAILING_SPACES_AND_TABS, ``)
}

/**
 * Finds the nearest line break behind a place.
 * @param string - The text.
 * @param from - Look back from here, inclusive; the end by default.
 * @returns The index of the break, or -1.
 */
export function lastLineBreakIndex (string: string, from: number = string.length - 1): number {
	for (let index = Math.min(from, string.length - 1); index >= 0; index -= 1) if (LINE_BREAK.test(string.charAt(index))) return index

	return -1
}

/** How a text reads backslashes: the ones the text in front ends on, and whether a place is inside a comment, whose backslashes are text. */
type Escapes = {
	lead: number,
	inComment: (index: number) => boolean,
}

/** A line's trailing whitespace: `index`, the last space or tab, where the problem is reported; `start`, where the run a fix takes opens. */
export type EolRun = {
	index: number,
	start: number,
}

/**
 * Finds a line's trailing whitespace. A space or tab a backslash escapes is a character of the word in front of it, so the run opens behind it, and a line ending on one alone ends on no whitespace.
 * @param lastEOLIndex - The line's end.
 * @param string - The source.
 * @param options - Whether empty lines are ignored, whether the line opens the root, and how the text reads backslashes, where it is code rather than prose.
 * @returns The run, or nothing.
 */
function findErrorStartIndex (lastEOLIndex: number, string: string, options: {
	ignoreEmptyLines: boolean,
	isRootFirst: boolean,
	escapes?: Escapes | undefined,
	lastBreakWritten?: boolean,
}): EolRun | undefined {
	let { ignoreEmptyLines, isRootFirst, escapes, lastBreakWritten = false } = options

	let eolWhitespaceIndex = lastEOLIndex - 1

	// A Windows pair's carriage return belongs to the break
	if (string.charAt(eolWhitespaceIndex) === `\r`) eolWhitespaceIndex -= 1

	// A semicolon a neighbor takes out is no character of the line
	while (string.charAt(eolWhitespaceIndex) === TAKEN_MARK) eolWhitespaceIndex -= 1

	// No whitespace before the break
	if (!WHITESPACES_TO_REJECT.has(string.charAt(eolWhitespaceIndex))) return undefined

	let start = eolWhitespaceIndex

	// A bare carriage return is a whitespace character of the line, and in front of a break the run goes on past it; the trim takes it with the spaces and tabs around it, which left against the break it would make a Windows pair of. At the end of the text the run stops at it, and so it does in front of a last break the file did not spell, which a neighbor wrote: the answer read off the file is one whichever side of that neighbor this rule is listed
	let crossesReturns = lastEOLIndex < string.length && !(lastBreakWritten && !LINE_BREAK.test(string.slice(lastEOLIndex + 1)))

	while ((crossesReturns ? SPACE_TAB_OR_CARRIAGE_RETURN : SPACE_OR_TAB).test(string.charAt(start - 1)) || string.charAt(start - 1) === TAKEN_MARK) start -= 1

	if (escapes && !escapes.inComment(start - 1) && isEscaped(string, start, escapes.lead)) start += 1

	if (start > eolWhitespaceIndex) return undefined

	if (ignoreEmptyLines) {
		// Only whitespace since the previous break
		let beforeNewlineIndex = lastLineBreakIndex(string, eolWhitespaceIndex)

		if (beforeNewlineIndex >= 0 || isRootFirst) {
			let line = string.slice(Math.max(0, beforeNewlineIndex), eolWhitespaceIndex)

			if (isOnlyWhitespace(line.replaceAll(TAKEN_MARK, ``))) return undefined
		}
	}

	return { index: eolWhitespaceIndex, start }
}

/** What a run of the rule reads everywhere: the syntax, the root, the result, whether empty lines are passed over, whether the file handed to the parser ends without a break, and whether the text closes on a line of the host code, where its end ends no line; where a disable comment keeps the fix off some line, whether it keeps a given one, and the runs the check found in the root's text, which the fix reads its own against. */
export type EolScope = {
	syntax: Syntax,
	root: Root,
	result: PostcssResult,
	ignoreEmptyLines: boolean,
	sourceEndsWithoutBreak: boolean,
	closesOnHostLine: boolean,
	kept?: ((line: number) => boolean) | undefined,
	found?: FoundRuns | undefined,
}

/** How a text is read: for `eachEolWhitespace`, and the stray semicolons of the text a neighbor takes out. */
export type TextOptions = {
	isRootFirst?: boolean,
	isPlainText?: boolean,
	lead?: number,
	taken?: Set<number>,
	lastBreakWritten?: boolean,
}

/**
 * Reads the runs of a text as the fix trims them, a stray semicolon a neighbor takes out read as absent.
 * @param scope - The run.
 * @param value - The text.
 * @param options - How the text is read.
 * @returns The runs, in order.
 */
export function runsOf (scope: EolScope, value: string | undefined, options?: TextOptions): EolRun[] {
	let runs: EolRun[] = []

	if (!value) return runs

	eachEolWhitespace(scope, maskTaken(value, options?.taken ?? new Set()), (run) => {
		runs.push(run)
	}, options)

	return runs
}

/**
 * Asks whether a disable comment keeps the fix off the line a run of a text stands on.
 * @param scope - The run.
 * @param lineOf - Reads the line of a run of the text.
 * @param index - The run's place.
 * @param rank - How many runs of the text stand in front of it.
 * @param runs - How many the text holds.
 * @param spelled - What the run spells.
 * @returns True where it does.
 */
export function keptAt (scope: EolScope, lineOf: LineOf | undefined, index: number, rank = 0, runs = 1, spelled = ``): boolean {
	if (!scope.kept || !lineOf) return false

	let line = lineOf(index, rank, runs, spelled)

	return line !== undefined && scope.kept(line)
}

/**
 * Calls back with each line's trailing whitespace.
 * @param scope - The run.
 * @param string - The text.
 * @param callback - Takes the run.
 * @param options - `isRootFirst` marks the root's first token, `isPlainText` prose, `lead` the backslashes the text in front ends on, `endsALine` a text whose end ends a line too, and `lastBreakWritten` a last break a neighbor wrote.
 */
export function eachEolWhitespace (scope: EolScope, string: string, callback: (run: EolRun) => void, options: {
	isRootFirst?: boolean,
	isPlainText?: boolean,
	lead?: number,
	endsALine?: boolean,
	lastBreakWritten?: boolean,
} = {}): void {
	let { syntax, root, result, ignoreEmptyLines } = scope
	let { isRootFirst = false, isPlainText = false, lead = 0, endsALine = false } = options
	let commentSpans = isPlainText ? [] : syntax.commentSpans(string, root, result)
	// Prose reads a backslash as a character like any other, and a text whose backslashes a host language cooks tells nothing of the stylesheet's
	let escapes = isPlainText || !syntax.readsBackslashesAsWritten(root) ? undefined : { lead, inComment: (index: number): boolean => commentSpans.some(({ start, end }) => start <= index && index < end) }
	// What stands between the parentheses of a bare address is the address's text, which Less hands on as it is: a run ending a line there is no run of the stylesheet, and the check and the fix pass it over alike, reading the address as the compilers do, over the text with its comments blanked
	let addresses = isPlainText ? [] : bareAddressSpans(blankComments(string, commentSpans))

	/**
	 * Reports the whitespace at a line ending.
	 * @param startIndex - The line ending.
	 */
	function handleEol (startIndex: number): void {
		let run = findErrorStartIndex(startIndex, string, {
			ignoreEmptyLines,
			isRootFirst,
			escapes,
			lastBreakWritten: options.lastBreakWritten ?? false,
		})

		if (run && !addresses.some(({ start, end }) => run.index > start && run.index < end - 1)) callback(run)
	}

	// A CSS scan of prose takes an apostrophe for an unclosed string
	if (isPlainText) {
		for (let { index } of string.matchAll(EVERY_LINE_BREAK)) handleEol(index)
	}
	else {
		styleSearch(
			{
				// The search reads a string by rules of its own, so it is handed none
				source: maskStrings(string, commentSpans),
				target: LINE_BREAK_CHARACTERS,
				comments: `check`,
			},
			(match) => {
				handleEol(match.startIndex)
			},
		)
	}

	if (endsALine) handleEol(string.length)
}

/**
 * Reads what a run spells, the stray semicolons a neighbor takes out left out.
 * @param read - The text, those semicolons marked.
 * @param start - Where the run opens.
 * @param index - Its last space or tab.
 * @returns The spelling.
 */
export function spelledRun (read: string, start: number, index: number): string {
	return read.slice(start, index + 1).replaceAll(TAKEN_MARK, ``)
}

/**
 * Trims the end of every line of a text.
 * @param scope - The run.
 * @param value - The text.
 * @param fixFn - Takes the trimmed text.
 * @param options - How the text is read, and the lines of the file its runs stand on, whose ends a disable comment may keep.
 */
export function fixText (scope: EolScope, value: string | undefined, fixFn: (text: string) => void, options?: TextOptions & { lineOf?: LineOf }): void {
	if (!value) return

	let taken = options?.taken ?? new Set()
	// A stray semicolon a neighbor takes out is read as absent, and stays for the neighbor to take
	let read = maskTaken(value, taken)
	let fixed = ``
	let lastIndex = 0
	let runs = runsOf(scope, value, options)

	for (let [rank, { index, start }] of runs.entries()) {
		// A line a disable comment keeps the fix off keeps its end
		if (keptAt(scope, options?.lineOf, index, rank, runs.length, spelledRun(read, start, index))) continue

		let newlineIndex = index + 1
		fixed += value.slice(lastIndex, start) + trimKeepingTaken(value.slice(start, newlineIndex), read.slice(start, newlineIndex))
		lastIndex = newlineIndex
	}

	if (lastIndex) {
		fixed += value.slice(lastIndex)
		fixFn(fixed)
	}
}
