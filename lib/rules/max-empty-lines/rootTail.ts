import type { ChildNode, Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { EVERY_RUN_OF_LINE_BREAKS_PAST_BLANK_LINES, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import type { NeighborRuleSetting } from "../../utils/neighborSettings/index.ts"
import { neighborCopies } from "../../utils/neighborSettings/index.ts"
import { straySemicolonsTaken, writtenAsLeft } from "../../utils/straySemicolonsTaken/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"

import { blankLinesRead } from "./blankLines.ts"

/** The rule that supplies the file's trailing break. */
const NO_MISSING_END_OF_SOURCE_NEWLINE: NeighborRuleSetting = {
	name: `no-missing-end-of-source-newline`,
	options: [true],
}

/**
 * Writes the file's end where a custom property closing the root without a semicolon keeps it: in its value, or behind its flag, with the root's own raw, which holds nothing but what a fix listed earlier wrote there, `no-missing-end-of-source-newline`'s break. The two are one run, the first of which the walk wrote as one standing inside a line; it is written over as the root's raw is, and kept where the parser keeps it, so that the neighbor listed later finds the raw as the parser left it. A missing raw is refused, since the run is read out of it, and a parser leaves none missing.
 * @param syntax - The syntax the rule is built over, which reads and writes the value.
 * @param root - The root.
 * @param last - Its last node.
 * @param result - The Stylelint result, which holds the configuration.
 * @param writeTail - What the rule makes of the file's end.
 * @returns True where the last node keeps the file's end and it was written.
 */
export function writeTheTailAPropertyKeeps (syntax: Syntax, root: Root, last: ChildNode, result: PostcssResult, writeTail: (text: string) => string): boolean {
	if (!isDeclaration(last) || !isCustomProperty(last.prop) || root.raws.semicolon || typeof root.raws.after !== `string`) return false

	let text = last.important ? last.raws.important ?? ` !important` : syntax.read(last)
	let held = text.slice(text.replace(TRAILING_CSS_WHITESPACE, ``).length)

	// Where both neighbors that rewrite this tail are live, `no-eol-whitespace` empties the line of spaces it stands on and `no-missing-end-of-source-newline` supplies the trailing break; write the tail as they leave it, so every order of the three converges in one run. The breaks come out of the held run, and a break the neighbor has already written in `root.raws.after` is carried into the value with it
	let eolAlive = blankLinesRead(root, result).go
	let noMissingAlive = neighborCopies(root, result, NO_MISSING_END_OF_SOURCE_NEWLINE).some((copy) => !copy.fixDisabled)

	if (eolAlive && noMissingAlive) {
		let heldWithoutBreaks = held.replace(EVERY_RUN_OF_LINE_BREAKS_PAST_BLANK_LINES, ``)
		let taken = new Set([...straySemicolonsTaken(root, result)].map((index) => index + heldWithoutBreaks.length))
		let written = text.slice(0, text.length - held.length) + writtenAsLeft((value) => value, heldWithoutBreaks + root.raws.after, taken)

		if (last.important) last.raws.important = written
		else syntax.write(last, written)

		root.raws.after = ``

		return true
	}

	let taken = new Set([...straySemicolonsTaken(root, result)].map((index) => index + held.length))
	let written = text.slice(0, text.length - held.length) + writtenAsLeft(writeTail, held + root.raws.after, taken)

	if (last.important) last.raws.important = written
	else syntax.write(last, written)

	root.raws.after = ``

	return true
}
