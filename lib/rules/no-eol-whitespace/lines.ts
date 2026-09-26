import type { Root } from "postcss"

import { EVERY_LINE_BREAK } from "../../regexps.ts"

/** Reads the line of the file a run of a text stands on: by its place, or by its rank among the runs the text holds and what it spells. */
export type LineOf = (index: number, rank: number, runs: number, spelled: string) => number | undefined

/**
 * Counts the breaks of a text.
 * @param text - The text.
 * @returns The count.
 */
function breaksIn (text: string): number {
	return (text.match(EVERY_LINE_BREAK) ?? []).length
}

/**
 * Reads the lines of a text that ends where a line of the file stands: a node's `raws.before` in front of the node, a block's `raws.after` in front of its closing brace. Each break behind a place takes it a line further up.
 * @param line - The line the text ends on, if the file holds it.
 * @param text - The text.
 * @returns The reader.
 */
export function linesBackFrom (line: number | undefined, text: string): LineOf {
	return (index) => (line === undefined ? undefined : line - breaksIn(text.slice(index)))
}

/**
 * Reads the lines of a text that opens behind a head on a line of the file: the parts of a node, from the line it opens on. Each break in front of a place takes it a line further down.
 * @param line - The line the head opens on, if the file holds it.
 * @param head - What stands in front of the text from there.
 * @param text - The text.
 * @returns The reader.
 */
export function linesOnFrom (line: number | undefined, head: string, text: string): LineOf {
	return (index) => (line === undefined ? undefined : line + breaksIn(head) + breaksIn(text.slice(0, index)))
}

/** The runs the check finds in a root's text: where each stands, on which line of the file, what it spells, whether a disable comment keeps its line, and whether it stays: a run ending a line of code, or a line of nothing but whitespace a disable comment keeps. A line of whitespace this rule empties anyway a neighbor listed earlier may have taken out, as `max-empty-lines` collapsing a run of empty lines does. */
export type FoundRuns = {
	offsets: number[],
	lines: number[],
	spelled: string[],
	kept: boolean[],
	stays: boolean[],
}

/** The runs the check found in a span: the lines of all of them, the lines and spellings of those that stay, and a line a disable comment keeps, if any. */
export type SpanRuns = { all: number[], staying: number[], stayingSpelled: string[], keptLine: number | undefined }

/**
 * Reads an entry of a list the check filled for each run it found.
 * @param list - The list.
 * @param rank - The run's rank.
 * @returns The entry.
 * @throws {Error} Where the list holds none for the run.
 */
function pick<T> (list: T[], rank: number): T {
	let entry = list[rank]

	if (entry === undefined) throw new Error(`The check must file an entry for every run it finds`)

	return entry
}

/**
 * Reads the runs the check found in a span of the root's text.
 * @param found - The runs, if a disable comment keeps the fix off some line.
 * @param span - Where the span opens and ends in the text, if the file holds it.
 * @returns The runs, in order.
 */
export function linesFound (found: FoundRuns | undefined, span: [number, number] | undefined): SpanRuns | undefined {
	if (!found || !span) return undefined

	let from = firstFrom(found.offsets, span[0])
	let ranks = [...Array.from({ length: firstFrom(found.offsets, span[1]) - from }).keys()].map((rank) => from + rank)
	let staying = ranks.filter((rank) => found.stays[rank])

	return {
		all: ranks.map((rank) => pick(found.lines, rank)),
		staying: staying.map((rank) => pick(found.lines, rank)),
		stayingSpelled: staying.map((rank) => pick(found.spelled, rank)),
		keptLine: found.lines[ranks.find((rank) => found.kept[rank]) ?? -1],
	}
}

/**
 * Reads the lines of the runs of a text by rank against the runs the check found in its span of the file. Where the span's texts hold as many runs as the check found there, a neighbor listed earlier has written none in or out, the runs are the same ones in the same order, and each stands on the line the check found its own on, however many breaks that neighbor wrote around it. Where they hold as many as stay, each spelled as the staying one of its rank, that neighbor took out the lines of whitespace this rule empties anyway, and the runs are the staying ones. Otherwise, where a disable comment keeps a line of the span, a run is read on that line and kept, since trimming a run that may stand on it would write what the comment keeps; else the fallback reads it.
 * @param lines - The runs the check found in the span.
 * @param fallback - Reads a run's line otherwise.
 * @param first - How many runs the span's texts in front of this one hold.
 * @param total - How many the span's texts hold, where they are more than this one.
 * @returns The reader.
 */
export function byRank (lines: SpanRuns | undefined, fallback: LineOf, first = 0, total?: number): LineOf {
	return (index, rank, runs, spelled) => {
		let count = total ?? runs

		if (lines?.all.length === count) return lines.all[first + rank]

		if (lines?.staying.length === count && lines.stayingSpelled[first + rank] === spelled) return lines.staying[first + rank]

		return lines?.keptLine ?? fallback(index, rank, runs, spelled)
	}
}

/**
 * Finds the first place in an ordered list holding a number from the one given on.
 * @param numbers - The list.
 * @param from - The number.
 * @returns The place, the list's length where none does.
 */
function firstFrom (numbers: number[], from: number): number {
	let low = 0
	let high = numbers.length

	while (low < high) {
		let middle = Math.floor((low + high) / 2)

		if ((numbers[middle] ?? from) < from) low = middle + 1
		else high = middle
	}

	return low
}

/**
 * Reads the line of the file an offset of a root's text stands on.
 * @param root - The root.
 * @param offset - The offset.
 * @returns The line.
 * @throws {Error} Where the offset stands past the text.
 */
export function lineInFile (root: Root, offset: number): number {
	let line = root.source?.input.fromOffset(offset)?.line

	if (line === undefined) throw new Error(`A run of the root's text must stand on a line of its input`)

	return line + (root.source?.start?.line ?? 1) - 1
}

/**
 * Reads the line of the file a root's text ends on.
 * @param root - The root.
 * @returns The line.
 */
export function rootsLastLine (root: Root): number {
	return (root.source?.start?.line ?? 1) + breaksIn(root.source?.input.css ?? ``)
}
