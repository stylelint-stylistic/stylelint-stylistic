import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import selectorAttributeOperatorSpaceChecker from "../../utils/selectorAttributeOperatorSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `selector-attribute-operator-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: (operator) => `Expected single space after "${operator}"`,
	rejectedAfter: (operator) => `Unexpected whitespace after "${operator}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const checker = whitespaceChecker(`space`, primary, messages)
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			checkBeforeOperator: false,
			fix: (attributeNode) => {
				/** @type {{ operatorAfter: string, setOperatorAfter: (fixed: string) => void }} */
				const { operatorAfter, setOperatorAfter } = (() => {
					const rawOperator = attributeNode.raws.operator

					if (rawOperator) {
						return {
							operatorAfter: rawOperator.slice(
								attributeNode.operator ? attributeNode.operator.length : 0,
							),
							setOperatorAfter (fixed) {
								delete attributeNode.raws.operator

								if (!attributeNode.raws.spaces) { attributeNode.raws.spaces = {} }

								if (!attributeNode.raws.spaces.operator) { attributeNode.raws.spaces.operator = {} }

								attributeNode.raws.spaces.operator.after = fixed
							},
						}
					}

					const rawSpacesOperator = attributeNode.raws.spaces && attributeNode.raws.spaces.operator
					const rawOperatorAfter = rawSpacesOperator && rawSpacesOperator.after

					if (rawOperatorAfter) {
						return {
							operatorAfter: rawOperatorAfter,
							setOperatorAfter (fixed) {
								rawSpacesOperator.after = fixed
							},
						}
					}

					return {
						operatorAfter: (attributeNode.spaces.operator && attributeNode.spaces.operator.after) || ``,
						setOperatorAfter (fixed) {
							if (!attributeNode.spaces.operator) { attributeNode.spaces.operator = {} }

							attributeNode.spaces.operator.after = fixed
						},
					}
				})()

				if (primary === `always`) {
					setOperatorAfter(operatorAfter.replace(/^\s*/, ` `))

					return true
				}

				if (primary === `never`) {
					setOperatorAfter(operatorAfter.replace(/^\s*/, ``))

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
