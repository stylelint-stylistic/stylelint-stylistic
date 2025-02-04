import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isSingleLineString from "../../utils/isSingleLineString.js"
import isStandardSyntaxFunction from "../../utils/isStandardSyntaxFunction.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `function-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
	expectedOpeningSingleLine: `Expected single space after "(" in a single-line function`,
	rejectedOpeningSingleLine: `Unexpected whitespace after "(" in a single-line function`,
	expectedClosingSingleLine: `Expected single space before ")" in a single-line function`,
	rejectedClosingSingleLine: `Unexpected whitespace before ")" in a single-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
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
			let declValue = getDeclarationValue(decl)
			let parsedValue = valueParser(declValue)

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

				let functionString = valueParser.stringify(valueNode)
				let isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

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
				let closingIndex = valueNode.sourceIndex + functionString.length - 2

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
				const problemIndex = declarationValueIndex(decl) + offset

				report({
					ruleName,
					result,
					message,
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
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
