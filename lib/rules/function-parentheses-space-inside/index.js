import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isSingleLineString from "../../utils/isSingleLineString.js"
import isStandardSyntaxFunction from "../../utils/isStandardSyntaxFunction.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `function-parentheses-space-inside`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
	expectedOpeningSingleLine: `Expected single space after "(" in a single-line function`,
	rejectedOpeningSingleLine: `Unexpected whitespace after "(" in a single-line function`,
	expectedClosingSingleLine: `Expected single space before ")" in a single-line function`,
	rejectedClosingSingleLine: `Unexpected whitespace before ")" in a single-line function`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) {
				return
			}

			let fix = null
			let hasFixed = false
			const declValue = getDeclarationValue(decl)
			const parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) {
					return
				}

				if (!isStandardSyntaxFunction(valueNode)) {
					return
				}

				// Ignore function without parameters
				if (!valueNode.nodes.length) {
					return
				}

				const functionString = valueParser.stringify(valueNode)
				const isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				const openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				if (primary === `always` && valueNode.before !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.before = ` `
					}
					complain(messages.expectedOpening, openingIndex)
				}

				if (primary === `never` && valueNode.before !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.before = ``
					}
					complain(messages.rejectedOpening, openingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.before !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.before = ` `
					}
					complain(messages.expectedOpeningSingleLine, openingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.before !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.before = ``
					}
					complain(messages.rejectedOpeningSingleLine, openingIndex)
				}

				// Check closing ...
				const closingIndex = valueNode.sourceIndex + functionString.length - 2

				if (primary === `always` && valueNode.after !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.after = ` `
					}
					complain(messages.expectedClosing, closingIndex)
				}

				if (primary === `never` && valueNode.after !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.after = ``
					}
					complain(messages.rejectedClosing, closingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.after !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.after = ` `
					}
					complain(messages.expectedClosingSingleLine, closingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.after !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.after = ``
					}
					complain(messages.rejectedClosingSingleLine, closingIndex)
				}
			})

			if (hasFixed) {
				setDeclarationValue(decl, parsedValue.toString())
			}

			/**
			 * @param {string} message
			 * @param {number} offset
			 */
			function complain (message, offset) {
				report({
					ruleName,
					result,
					message,
					node: decl,
					index: declarationValueIndex(decl) + offset,
					fix,
				})
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
