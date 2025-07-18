import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isSingleLineString } from "../../utils/isSingleLineString/index.js"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `function-parentheses-newline-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected newline after "("`,
	expectedClosing: `Expected newline before ")"`,
	expectedOpeningMultiLine: `Expected newline after "(" in a multi-line function`,
	rejectedOpeningMultiLine: `Unexpected whitespace after "(" in a multi-line function`,
	expectedClosingMultiLine: `Expected newline before ")" in a multi-line function`,
	rejectedClosingMultiLine: `Unexpected whitespace before ")" in a multi-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, _secondaryOptions, context) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
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

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				function containsNewline (/** @type {string} */ str) {
					return str.includes(`\n`)
				}

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let checkBefore = getCheckBefore(valueNode)

				if (primary === `always` && !containsNewline(checkBefore)) {
					fix = () => {
						hasFixed = true
						fixBeforeForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedOpening, openingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !containsNewline(checkBefore)) {
					fix = () => {
						hasFixed = true
						fixBeforeForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedOpeningMultiLine, openingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
					fix = () => {
						hasFixed = true
						fixBeforeForNever(valueNode)
					}
					complain(messages.rejectedOpeningMultiLine, openingIndex)
				}

				// Check closing ...
				let closingIndex = valueNode.sourceIndex + functionString.length - 2
				let checkAfter = getCheckAfter(valueNode)

				if (primary === `always` && !containsNewline(checkAfter)) {
					fix = () => {
						hasFixed = true
						fixAfterForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedClosing, closingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !containsNewline(checkAfter)) {
					fix = () => {
						hasFixed = true
						fixAfterForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedClosingMultiLine, closingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkAfter !== ``) {
					fix = () => {
						hasFixed = true
						fixAfterForNever(valueNode)
					}
					complain(messages.rejectedClosingMultiLine, closingIndex)
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

/** @typedef {import('postcss-value-parser').FunctionNode} FunctionNode */

/**
 * @param {FunctionNode} valueNode
 */
function getCheckBefore (valueNode) {
	let before = valueNode.before

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) {
			continue
		}

		if (node.type === `space`) {
			before += node.value
			continue
		}

		break
	}

	return before
}

/**
 * @param {FunctionNode} valueNode
 */
function getCheckAfter (valueNode) {
	let after = ``

	for (let node of [...valueNode.nodes].reverse()) {
		if (node.type === `comment`) {
			continue
		}

		if (node.type === `space`) {
			after = node.value + after
			continue
		}

		break
	}

	after += valueNode.after

	return after
}

/**
 * @param {FunctionNode} valueNode
 * @param {string} newline
 */
function fixBeforeForAlways (valueNode, newline) {
	let target

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) {
			continue
		}

		if (node.type === `space`) {
			target = node
			continue
		}

		break
	}

	if (target) {
		target.value = newline + target.value
	} else {
		valueNode.before = newline + valueNode.before
	}
}

/**
 * @param {FunctionNode} valueNode
 */
function fixBeforeForNever (valueNode) {
	valueNode.before = ``

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) {
			continue
		}

		if (node.type === `space`) {
			node.value = ``
			continue
		}

		break
	}
}

/**
 * @param {FunctionNode} valueNode
 * @param {string} newline
 */
function fixAfterForAlways (valueNode, newline) {
	valueNode.after = newline + valueNode.after
}

/**
 * @param {FunctionNode} valueNode
 */
function fixAfterForNever (valueNode) {
	valueNode.after = ``

	for (let node of [...valueNode.nodes].reverse()) {
		if (node.type === `comment`) {
			continue
		}

		if (node.type === `space`) {
			node.value = ``
			continue
		}

		break
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
