import { EVERY_CHARACTER_BUT_A_SEMICOLON, TRAILING_SPACES_TABS_AND_TAKEN_MARKS, TRAILING_SPACES_TABS_CARRIAGE_RETURNS_AND_TAKEN_MARKS } from "../../regexps.ts"

/** The mark a stray semicolon a neighbor takes out is read as: absent, neither code nor whitespace. */
export const TAKEN_MARK = `\0`

/**
 * Reads a text with the stray semicolons a neighbor takes out marked as absent.
 * @param text - The text.
 * @param taken - The semicolons' indices in it.
 * @returns The text as read.
 */
export function maskTaken (text: string, taken: Set<number>): string {
	if (taken.size === 0) return text

	let read = ``

	for (let index = 0; index < text.length; index += 1) read += taken.has(index) ? TAKEN_MARK : text.charAt(index)

	return read
}

/**
 * Trims a line's trailing run off a piece of a text — its spaces, tabs and, in front of a break, bare carriage returns, reading the piece with the semicolons a neighbor takes out marked — and keeps those semicolons for the neighbor to take.
 * @param piece - The piece.
 * @param read - The same piece as read.
 * @param crossesReturns - Whether a break stands behind the piece, so that the run goes on past a bare carriage return.
 * @returns The piece trimmed.
 */
export function trimKeepingTaken (piece: string, read: string, crossesReturns: boolean = true): string {
	let trailing = read.length - read.replace(crossesReturns ? TRAILING_SPACES_TABS_CARRIAGE_RETURNS_AND_TAKEN_MARKS : TRAILING_SPACES_TABS_AND_TAKEN_MARKS, ``).length

	return piece.slice(0, piece.length - trailing) + piece.slice(piece.length - trailing).replaceAll(EVERY_CHARACTER_BUT_A_SEMICOLON, ``)
}
