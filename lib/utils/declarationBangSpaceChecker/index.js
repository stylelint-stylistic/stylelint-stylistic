import styleSearch from "style-search"
import stylelint from "stylelint"

import { applyEditsFromEnd } from "../applyEditsFromEnd/index.js"
import { declarationString } from "../declarationString/index.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { searchCopy } from "../searchCopy/index.js"
import { setDeclarationValue } from "../setDeclarationValue/index.js"

let { utils: { report } } = stylelint

/** @typedef {import('../applyEditsFromEnd/index.js').Edit} Edit */
/** @typedef {import('postcss').Declaration} Declaration */

/**
 * The text one bang of a declaration stands in, and where in that text it stands.
 * @typedef {{ text: string, index: number }} BangTarget
 */

/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * Checks whitespace around bang operators in declarations.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 *   fix: ((target: BangTarget) => Edit[]),
 *   isFixable?: ((decl: Declaration, index: number) => boolean),
 * }} opts - The options object.
 * @returns {void}
 */
export function declarationBangSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		let indexOffset = declarationValueIndex(decl)
		let declString = declarationString(decl)
		let { searchString } = searchCopy(declString, decl, opts.result)
		let valueString = searchString.slice(indexOffset)

		if (!valueString.includes(`!`)) return

		let value = getDeclarationValue(decl)
		// A declaration spells its bangs in two texts, each written back through a setter of its own: the value the file spells, and the raw of the flag, which is where the syntax keeps the whitespace and the comments standing in front of `!important`. A declaration carrying no flag has no second text, and no bang of it can be found behind the value
		let importantRaw = decl.important ? (decl.raws.important || ` !important`) : ``

		// What each fix changed, and nothing else: an index counted in either text goes stale the moment a write in front of it changes the length of what it replaces, so nothing is written until every bang has been read
		/** @type {Edit[]} */
		let valueEdits = []

		/** @type {Edit[]} */
		let importantEdits = []

		styleSearch({ source: valueString, target: `!` }, (match) => {
			let standsInValue = match.startIndex < value.length
			let target = standsInValue
				? { text: value, index: match.startIndex }
				: { text: importantRaw, index: match.startIndex - value.length }
			let edits = standsInValue ? valueEdits : importantEdits
			let index = match.startIndex + indexOffset

			// A rule may know that this particular problem cannot be fixed without breaking the code
			let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(decl, index))

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
						fix: isFixable
							? () => {
								edits.push(...opts.fix(target))
							}
							: undefined,
					})
				},
			})
		})

		if (valueEdits.length > 0) setDeclarationValue(decl, applyEditsFromEnd(value, valueEdits))

		if (importantEdits.length > 0) decl.raws.important = applyEditsFromEnd(importantRaw, importantEdits)
	})
}
