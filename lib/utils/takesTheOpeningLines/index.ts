import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_LINE_BREAK, EVERY_SEMICOLON, LEADING_CSS_WHITESPACE_AND_SEMICOLONS, OPENS_WITH_LINE_BREAK } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { neighborCopies, type NeighborRuleSetting } from "../neighborSettings/index.ts"
import { semicolonsTakenAlready } from "../semicolonsTakenAlready/index.ts"
import { straySemicolonsTaken, straySemicolonsTakenBefore, withoutTaken } from "../straySemicolonsTaken/index.ts"
import type { EmbeddedSource } from "../typeGuards/index.ts"

/** The rule that takes the empty lines a file opens with off the raw they stand in. */
const NO_EMPTY_FIRST_LINE: NeighborRuleSetting = {
	name: `no-empty-first-line`,
	options: [true],
}

/**
 * Finds the stray semicolons a file opens with that the neighbors leave no trace of: those they take out of the head raw in the same run, and those a rule listed earlier took out already.
 *
 * The head raw — the first node's `raws.before`, or an empty root's `raws.after` — is asked as it stands, and a write of a rule listed earlier shifts it against the file, so its semicolons are matched to the file's by rank rather than by place: such a write keeps every semicolon in its order, or is the neighbor's own, whose taken ones `semicolonsTakenAlready` finds in the file. Where the counts do not meet, the head's semicolons go all together where the raw holds none but taken ones, and stay all together otherwise.
 * @param root - The stylesheet.
 * @param text - Its text.
 * @param result - The PostCSS result carrying the configuration.
 * @returns The semicolons' offsets in the text.
 */
function headSemicolonsGone (root: Root, text: string, result: PostcssResult): Set<number> {
	let head = text.match(LEADING_CSS_WHITESPACE_AND_SEMICOLONS)?.[0] ?? ``
	let inFile = [...head.matchAll(EVERY_SEMICOLON)].map(({ index }) => index)

	if (inFile.length === 0) return new Set()

	let { first } = root
	let raw = first ? first.raws.before : root.raws.after

	if (typeof raw !== `string`) return new Set(inFile)

	let taken = first ? straySemicolonsTakenBefore(first, result) : straySemicolonsTaken(root, result)
	let inRaw = [...raw.matchAll(EVERY_SEMICOLON)].map(({ index }) => index)
	let already = semicolonsTakenAlready(root, text, result)
	let left = inFile.filter((offset) => !already.has(offset))

	if (left.length === inRaw.length) {
		let takenNow = left.filter((_, rank) => {
			let index = inRaw[rank]

			if (index === undefined) throw new Error(`The raw must hold a semicolon for every one the file's head has left`)

			return taken.has(index)
		})

		return new Set([...inFile.filter((offset) => already.has(offset)), ...takenNow])
	}

	return inRaw.length === taken.size ? new Set(inFile) : new Set()
}

/**
 * Counts the line breaks of the empty lines a file opens with, as `no-empty-first-line` reads them: on the text handed to the parser, its head read without the semicolons the neighbors take out, so that a line holding nothing but such a semicolon is empty whichever side of that neighbor alone the reader is listed. A semicolon one of them keeps is a character of its line, where the file spells it. Where the text opens on a line of the host code, a styled template's, the first break of the run ends that line and is no empty line.
 *
 * The guards are that rule's own: an inline `style` attribute's root and a CSS-in-JS object literal are passed over, and a file of whitespace alone opens with no empty line.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @param syntax - The syntax of the rule asking, which is the root's, since one family reads a root.
 * @returns The count, none where the file opens with no empty line.
 */
export function openingLineBreaks (root: Root, result: PostcssResult, syntax: Syntax): number {
	let source: EmbeddedSource | undefined = root.source

	if (source?.inline || source?.lang === `object-literal`) return 0

	let text = source?.input.css ?? ``
	let read = withoutTaken(text, headSemicolonsGone(root, text, result))

	if (!read.trim()) return 0

	let breaks = [...(OPENS_WITH_LINE_BREAK.exec(read)?.[0] ?? ``).matchAll(EVERY_LINE_BREAK)].length

	return syntax.hostLineEdges(root).opens ? Math.max(0, breaks - 1) : breaks
}

/**
 * Asks whether `no-empty-first-line` takes the empty lines this file opens with off the raw they stand in, so that a rule writing the same raw leaves that run alone.
 *
 * The run is one both rules read and both take breaks out of. Where the file leaves the root no node the raw is the whole file, so the two of them took one break each where one stood, and which of the two got there first was the configuration's to decide.
 *
 * The question is put to the text {@link openingLineBreaks} reads, which is the text `no-empty-first-line` reads, so both rules answer it alike wherever either stands in the configuration and however far the tree has been written by then. A copy whose fix is off writes nothing.
 * @param root - The stylesheet.
 * @param result - The PostCSS result carrying the configuration.
 * @param syntax - The syntax of the rule asking, which is the root's, since one family reads a root.
 * @returns True where a live copy of the rule takes the run off.
 */
export function takesTheOpeningLines (root: Root, result: PostcssResult, syntax: Syntax): boolean {
	if (openingLineBreaks(root, result, syntax) === 0) return false

	return neighborCopies(root, result, NO_EMPTY_FIRST_LINE).some(({ fixDisabled }) => !fixDisabled)
}
