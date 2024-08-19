import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import valueListCommaWhitespaceChecker from "../../utils/valueListCommaWhitespaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `value-list-comma-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line list`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) {
			return
		}

		/** @type {Map<import('postcss').Declaration, number[]> | undefined} */
		let fixData

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: (declNode, index) => {
				let valueIndex = declarationValueIndex(declNode)

				if (index <= valueIndex) {
					return false
				}

				fixData = fixData || (new Map)

				let commaIndices = fixData.get(declNode) || []

				commaIndices.push(index)
				fixData.set(declNode, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (let [decl, commaIndices] of fixData.entries()) {
				for (let index of commaIndices.sort((a, b) => b - a)) {
					let value = getDeclarationValue(decl)
					let valueIndex = index - declarationValueIndex(decl)
					let beforeValue = value.slice(0, valueIndex)
					let afterValue = value.slice(valueIndex)

					if (primary.startsWith(`always`)) {
						beforeValue = beforeValue.replace(/\s*$/, ` `)
					} else if (primary.startsWith(`never`)) {
						beforeValue = beforeValue.replace(/\s*$/, ``)
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
