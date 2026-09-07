import type { Declaration, Root } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

let { utils: { report } } = stylelint

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
		let { searchString } = opts.syntax.searchCopy(declString, decl, opts.result)
		let valueString = searchString.slice(indexOffset)

		if (!valueString.includes(`!`)) return

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

			// A rule may know the fix would break the code
			let isFixable = fix && (!opts.isFixable || opts.isFixable(decl, index))

			opts.locationChecker({
				source: declString,
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
								for (let edit of fix({ text: declString, index })) fileEdit(parts, edit)
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
