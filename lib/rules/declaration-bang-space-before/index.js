import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationBangSpaceChecker } from "../../utils/declarationBangSpaceChecker/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-bang-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "!"`,
	rejectedBefore: () => `Unexpected whitespace before "!"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets everything the declaration holds in front of the bang, spelled as the file spells it.
 * @param {import('postcss').Declaration} decl - The declaration to look at.
 * @param {number} index - The index of the bang within the declaration's string.
 * @returns {string} The text standing in front of the bang.
 */
function beforeBangString (decl, index) {
	let raws = decl.raws
	// The index counts in what `decl.toString()` prints, so the raw is the copy to measure in
	let rawValue = (raws.value && raws.value.raw) || decl.value
	// `postcss-scss` rewrites every `//` comment of a value into a block comment, keeps the spelling
	// of the file in a copy of its own and prints that copy, while it keeps no such copy of
	// `decl.raws.important`: the comment a fix runs into is the one the printed copy spells.
	// No rewriting crosses a line break, since an inline comment runs to the end of its line, so the
	// two copies hold the same lines and only the text within a line moves.
	let printedValue = (raws.value && raws.value.scss) || rawValue
	let bangIndex = index - declarationValueIndex(decl)

	if (bangIndex < rawValue.length) {
		let before = rawValue.slice(0, bangIndex)

		// Only a line break closes an inline comment, so where the run the fix cuts holds none, the
		// bang stands behind code of its own line and no comment of that kind is open in front of it
		if (!(/\n\s*$/u).test(before)) return before

		// Nothing but that run stands on the bang's own line, so a comment reaching it ends a line in front of it
		return printedValue.split(`\n`).slice(0, before.split(`\n`).length - 1).join(`\n`)
	}

	// The bang stands behind the value, in `decl.raws.important`, which is where the fix writes
	let important = raws.important || ` !important`

	return printedValue + important.slice(0, bangIndex - rawValue.length)
}

/**
 * Requires a single space or disallows whitespace before the bang of declarations.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		declarationBangSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The bang goes right after this text, and the whitespace run the fix cuts into ends it.
			// Where an inline comment stands there, the line break that run begins with is what closes
			// the comment, so either option would take the bang, and the semicolon behind it, into the
			// comment's text: neither can be satisfied, so leave the code alone and let the warning stand
			isFixable: (decl, index) => !endsWithInlineComment(beforeBangString(decl, index)),
			fix: (decl, index) => {
				let bangIndex = index - declarationValueIndex(decl)
				let value = getDeclarationValue(decl)
				let target

				/** @type {(val: string) => void} */
				let setFixed

				if (bangIndex < value.length) {
					target = value
					setFixed = (val) => {
						setDeclarationValue(decl, val)
					}
				}
				else if (decl.important) {
					target = decl.raws.important || ` !important`
					bangIndex -= value.length
					setFixed = (val) => {
						decl.raws.important = val
					}
				}
				else return false // not standard

				let targetBefore = target.slice(0, bangIndex)
				let targetAfter = target.slice(bangIndex)

				if (primary === `always`) {
					setFixed(`${targetBefore.replace(/\s*$/u, ``)} ${targetAfter}`)

					return true
				}

				if (primary === `never`) {
					setFixed(targetBefore.replace(/\s*$/u, ``) + targetAfter)

					return true
				}

				return false
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
