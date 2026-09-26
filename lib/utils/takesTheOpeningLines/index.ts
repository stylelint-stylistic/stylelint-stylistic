import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, EVERY_SEMICOLON, LEADING_CSS_WHITESPACE_AND_SEMICOLONS, OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { straySemicolonsTaken, straySemicolonsTakenBefore } from "../straySemicolonsTaken/index.ts"
import type { EmbeddedSource } from "../typeGuards/index.ts"

/** The rule that takes the empty lines a file opens with off the raw they stand in. */
const NO_EMPTY_FIRST_LINE: NeighborRuleSetting = {
	name: `no-empty-first-line`,
	options: [true],
}

/**
 * Asks whether the neighbors leave none of the stray semicolons a file opens with: every one its head raw still holds is one they take out in the same run. Asked of the raw as it stands, by count rather than by place, since a write of a rule listed earlier shifts the raw against the file: such a write keeps every semicolon, or is the neighbor's own, which has taken out those it takes. A head holding one the neighbor takes and one it keeps is read with both.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @returns True where they leave none.
 */
function headSemicolonsGo (root: Root, result: PostcssResult): boolean {
	let { first } = root
	let raw = first ? first.raws.before : root.raws.after

	if (typeof raw !== `string`) return true

	let taken = first ? straySemicolonsTakenBefore(first, result) : straySemicolonsTaken(root, result)

	return (raw.match(EVERY_SEMICOLON) ?? []).length === taken.size
}

/**
 * Counts the line breaks of the empty lines a file opens with, as `no-empty-first-line` reads them: on the text handed to the parser, its head read without its semicolons where the neighbors leave none of them, so that a line holding nothing but such a semicolon is empty whichever side of the neighbor the reader is listed. A semicolon one of them keeps is a character of its line, where the file spells it.
 *
 * The guards are that rule's own: an inline `style` attribute's root and a CSS-in-JS object literal are passed over, and a file of whitespace alone opens with no empty line.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @returns The count, none where the file opens with no empty line.
 */
export function openingLineBreaks (root: Root, result: PostcssResult): number {
	let source: EmbeddedSource | undefined = root.source

	if (source?.inline || source?.lang === `object-literal`) return 0

	let text = source?.input.css ?? ``
	let read = headSemicolonsGo(root, result) ? text.replace(LEADING_CSS_WHITESPACE_AND_SEMICOLONS, (head) => head.replaceAll(EVERY_SEMICOLON, ``)) : text

	if (!read.trim()) return 0

	return [...(OPENS_WITH_LINE_BREAK.exec(read)?.[0] ?? ``).matchAll(EVERY_LINE_BREAK)].length
}

/**
 * Asks whether `no-empty-first-line` takes the empty lines this file opens with off the raw they stand in, so that a rule writing the same raw leaves that run alone.
 *
 * The run is one both rules read and both take breaks out of. Where the file leaves the root no node the raw is the whole file, so the two of them took one break each where one stood, and which of the two got there first was the configuration's to decide.
 *
 * The question is put to the text {@link openingLineBreaks} reads, which is the text `no-empty-first-line` reads, so both rules answer it alike wherever either stands in the configuration and however far the tree has been written by then. A copy whose fix is off writes nothing. A styled template's root is passed over by neither guard, since no copy of the rule under a namespace reading such a root is listed here.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @returns True where a live copy of the rule takes the run off.
 */
export function takesTheOpeningLines (root: Root, result: PostcssResult): boolean {
	if (openingLineBreaks(root, result) === 0) return false

	return neighborCopies(root, result, NO_EMPTY_FIRST_LINE).some(({ fixDisabled }) => !fixDisabled)
}
