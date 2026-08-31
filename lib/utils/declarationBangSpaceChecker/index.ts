import type { Declaration, Root } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { searchCopy } from "../searchCopy/index.ts"

let { utils: { report } } = stylelint

/** The declaration as the file prints it, and where in that print one bang of it stands. */
export type BangTarget = {
	text: string,
	index: number,
}

/** One of the texts a declaration is printed from that a fix can write into: where it opens in that print, what it holds, how it is written back, and what is to be written into it. */
export type DeclarationPart = {
	start: number,
	text: string,
	write: (text: string) => void,
	edits: Edit[],
}

/** A function that checks whitespace at a specific location. */
export type LocationChecker = (args: {
	source: string,
	index: number,
	err: (message: string) => void,
}) => void

/**
 * Files one edit of a printed declaration under the texts it is printed from.
 *
 * A whitespace run standing beside a bang is a run of the print, and the print is several texts laid end to end, so a run may open in one of them and close in the next. Every text the edit reaches into loses the characters of it that stand there; what the edit writes goes into the text it closes in, so the space either rule asks for lands against the bang rather than at the far end of the run. That text is not always the one the bang stands in: a value ending on a bang of its own hands the run behind it to the flag.
 *
 * A text the edit neither writes into nor takes anything out of is left without an edit at all, so that a declaration is written back only where it changed. No two edits of one declaration ever name one span of one text — the run in front of a bang opens behind the bang before it, and the run behind one closes in front of the next — so each is pushed as it comes rather than folded into the one standing there.
 * @param parts - The writable texts, in the order they are printed; the edits are added to them in place.
 * @param edit - The edit, measured in the printed declaration.
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
 * Checks whitespace around bang operators in declarations.
 * @param opts - The options object.
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
		let { searchString } = searchCopy(declString, decl, opts.result)
		let valueString = searchString.slice(indexOffset)

		if (!valueString.includes(`!`)) return

		let between = decl.raws.between || `:`
		let value = opts.syntax.read(decl)

		// A declaration is printed from four texts laid end to end — the property, what stands between it and the value, the value, and the raw of the flag — and where PostCSS puts the whitespace standing in front of a bang depends on what stands in front of that: it reaches the raw of the flag only where the value has a word of its own to leave behind, it stays at the tail of the value where the value is nothing but comments and whitespace, and it stays at the tail of `raws.between` where the flag is not `!important` and is no raw at all. The colon `raws.between` always carries is where any such run stops, so the property is never written into and the three texts behind it are all a fix needs. Where each of them opens follows from `declarationValueIndex`, which counts the property and that one raw and nothing else, since no syntax this plugin reads through spells a prefix in front of a value
		let parts: DeclarationPart[] = [
			{ start: indexOffset - between.length, text: between, write: (text) => { decl.raws.between = text }, edits: [] },
			{ start: indexOffset, text: value, write: (text) => { opts.syntax.write(decl, text) }, edits: [] },
		]

		// A declaration carrying no flag has no third text: `raws.important` is printed behind the flag and nowhere else, so a write into it there would be dropped without a trace
		if (decl.important) parts.push({ start: indexOffset + value.length, text: decl.raws.important || ` !important`, write: (text) => { decl.raws.important = text }, edits: [] })

		styleSearch({ source: valueString, target: `!` }, (match) => {
			let index = match.startIndex + indexOffset

			// A rule may know that this particular problem cannot be fixed without breaking the code
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

		// What each fix changed, and nothing else: an index counted in a text goes stale the moment a write in front of it changes the length of what it replaces, so nothing is written until every bang has been read
		for (let part of parts) if (part.edits.length > 0) part.write(applyEditsFromEnd(part.text, part.edits))
	})
}
