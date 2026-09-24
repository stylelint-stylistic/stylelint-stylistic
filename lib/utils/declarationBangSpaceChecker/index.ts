import type { Declaration, Root } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { TRAILING_BACKSLASHES } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { editKeepsEscapedCharacter } from "../editKeepsEscapedCharacter/index.ts"
import { findAddressSpans, findCommentSpanAt } from "../findCommentSpans/index.ts"
import { report } from "../report/index.ts"
import { rereadsAnAddress } from "../rereadsAnAddress/index.ts"

/** The declaration as printed, and the index of one bang in it. */
export type BangTarget = {
	text: string,
	index: number,
}

/** A text a declaration is printed from: its start in the print, its text, its writer, its edits. */
export type DeclarationPart = {
	start: number,
	text: string,
	write: (text: string) => void,
	edits: Edit[],
}

/** Checks whitespace at a location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	err: (message: string) => void,
}) => void

/**
 * Files one edit of a printed declaration under the texts it is printed from. A whitespace run beside a bang may open in one text and close in the next: each text the edit reaches loses its characters there, and the edit's text goes into the one it closes in, so the space lands against the bang.
 * @param parts - The writable texts, in print order.
 * @param edit - The edit, in the print's coordinates.
 */
function fileEdit (parts: DeclarationPart[], edit: Edit): void {
	let holder = parts.findLast(({ start }) => start <= edit.end)

	for (let part of parts) {
		let end = part.start + part.text.length
		let from = Math.min(Math.max(edit.start, part.start), end)
		let to = Math.min(Math.max(edit.end, part.start), end)
		let text = part === holder ? edit.text : ``

		if (from === to && !text) continue

		part.edits.push({ start: from - part.start, end: to - part.start, text })
	}
}

/**
 * Checks whitespace around the bangs of declarations.
 * @param opts - The options.
 */
export function declarationBangSpaceChecker (opts: {
	root: Root,
	locationChecker: LocationChecker,
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
	fix?: ((target: BangTarget) => Edit[]),
	isFixable?: ((decl: Declaration, index: number) => boolean),
}): void {
	let { fix } = opts

	opts.root.walkDecls((decl) => {
		let indexOffset = declarationValueIndex(decl)
		let declString = declarationString(opts.syntax, decl)
		let { searchString, runString } = opts.syntax.searchCopy(declString, decl, opts.result)
		let valueString = searchString.slice(indexOffset)

		if (!valueString.includes(`!`)) return

		// `searchCopy` leaves a bare address code, and a bang there is a character of the address
		let reading = opts.syntax.inlineComments(decl, opts.result)
		let addresses = findAddressSpans(declString, reading)
		let between = decl.raws.between || `:`
		let value = opts.syntax.read(decl)

		// PostCSS puts the whitespace in front of a bang in the flag's raw where the value has a word, at the value's tail where it is only comments and whitespace, and at the tail of `raws.between` where the flag is not `!important`; the colon stops any run, so the property is never written into
		let parts: DeclarationPart[] = [
			{ start: indexOffset - between.length, text: between, write: (text) => { decl.raws.between = text }, edits: [] },
			{ start: indexOffset, text: value, write: (text) => { opts.syntax.write(decl, text) }, edits: [] },
		]

		// `raws.important` is printed only behind a flag, so a flagless declaration has no third text
		if (decl.important) parts.push({ start: indexOffset + value.length, text: decl.raws.important || ` !important`, write: (text) => { decl.raws.important = text }, edits: [] })

		styleSearch({ source: valueString, target: `!` }, (match) => {
			let index = match.startIndex + indexOffset

			if (findCommentSpanAt(index, addresses)) return

			// A bang behind an odd run of backslashes is a character of a word, and no flag to PostCSS, Less or Sass
			let head = declString.slice(0, index)

			if ((head.length - head.replace(TRAILING_BACKSLASHES, ``).length) % 2 === 1) return

			// A rule may know the fix would break the code; a write parting the name of a bare address from the bang or joining it to the bang switches how PostCSS reads the parentheses, and one changing the character behind a backslash is read with it. The run is measured over the copy with its escapes masked, as the check reads it: an escaped space in front of the bang is a character of a word and no run (1789657288)
			let isFixable = fix && (!opts.isFixable || opts.isFixable(decl, index)) && fix({ text: runString, index }).every((edit) => !rereadsAnAddress(declString, edit, reading) && editKeepsEscapedCharacter(declString, edit))

			opts.locationChecker({
				source: runString,
				index,
				err: (message) => {
					report({
						message,
						node: decl,
						index,
						endIndex: index,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						...(fix && isFixable && {
							fix: (): void => {
								for (let edit of fix({ text: runString, index })) fileEdit(parts, edit)
							},
						}),
					})
				},
			})
		})

		// Writes wait until every bang is read, since one would shift the next index
		for (let part of parts) if (part.edits.length > 0) part.write(applyEditsFromEnd(part.text, part.edits))
	})
}
