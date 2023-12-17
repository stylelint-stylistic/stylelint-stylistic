import stylelint from "stylelint"

import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import valueListCommaWhitespaceChecker from "../../utils/valueListCommaWhitespaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `value-list-comma-newline-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) {
			return
		}

		/** @type {Map<import('postcss').Declaration, number[]> | undefined} */
		let fixData

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			fix: context.fix ? (declNode, index) => {
				const valueIndex = declarationValueIndex(declNode)

				if (index <= valueIndex) {
					return false
				}

				fixData = fixData || new Map()
				const commaIndices = fixData.get(declNode) || []

				commaIndices.push(index)
				fixData.set(declNode, commaIndices)

				return true
			} : null,
			determineIndex: (declString, match) => {
				const nextChars = declString.substring(match.endIndex, declString.length)

				// If there's a // comment, that means there has to be a newline
				// ending the comment so we're fine
				if (/^[ \t]*\/\//.test(nextChars)) {
					return false
				}

				// If there are spaces and then a comment begins, look for the newline
				return /^[ \t]*\/\*/.test(nextChars) ? declString.indexOf(`*/`, match.endIndex) + 1 : match.startIndex
			},
		})

		if (fixData) {
			for (const [decl, commaIndices] of fixData.entries()) {
				for (const index of commaIndices.sort((a, b) => a - b).reverse()) {
					const value = getDeclarationValue(decl)
					const valueIndex = index - declarationValueIndex(decl)
					const beforeValue = value.slice(0, valueIndex + 1)
					let afterValue = value.slice(valueIndex + 1)

					if (primary.startsWith(`always`)) {
						afterValue = context.newline + afterValue
					} else if (primary.startsWith(`never-multi-line`)) {
						afterValue = afterValue.replace(/^\s*/, ``)
					}

					setDeclarationValue(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
