import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import parseSelector from "../../utils/parseSelector.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `selector-pseudo-class-parentheses-space-inside`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
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
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) {
				return
			}

			if (!ruleNode.selector.includes(`(`)) {
				return
			}

			let fix = null
			let hasFixed = false
			const selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector
			const fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					if (!pseudoNode.length) {
						return
					}

					const paramString = pseudoNode.map((node) => String(node)).join(`,`)
					const nextCharIsSpace = paramString.startsWith(` `)
					const openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

					if (nextCharIsSpace && primary === `never`) {
						fix = () => {
							hasFixed = true
							setFirstNodeSpaceBefore(pseudoNode, ``)
						}
						complain(messages.rejectedOpening, openIndex)
					}

					if (!nextCharIsSpace && primary === `always`) {
						fix = () => {
							hasFixed = true
							setFirstNodeSpaceBefore(pseudoNode, ` `)
						}
						complain(messages.expectedOpening, openIndex)
					}

					const prevCharIsSpace = paramString.endsWith(` `)
					const closeIndex = openIndex + paramString.length - 1

					if (prevCharIsSpace && primary === `never`) {
						fix = () => {
							hasFixed = true
							setLastNodeSpaceAfter(pseudoNode, ``)
						}
						complain(messages.rejectedClosing, closeIndex)
					}

					if (!prevCharIsSpace && primary === `always`) {
						fix = () => {
							hasFixed = true
							setLastNodeSpaceAfter(pseudoNode, ` `)
						}
						complain(messages.expectedClosing, closeIndex)
					}
				})
			})

			if (hasFixed && fixedSelector) {
				if (!ruleNode.raws.selector) {
					ruleNode.selector = fixedSelector
				} else {
					ruleNode.raws.selector.raw = fixedSelector
				}
			}

			/**
			 * @param {string} message
			 * @param {number} index
			 */
			function complain (message, index) {
				report({
					message,
					index,
					result,
					ruleName,
					node: ruleNode,
					fix,
				})
			}
		})
	}
}

/**
 * @param {import('postcss-selector-parser').Container} node
 * @param {string} value
 * @returns {void}
 */
function setFirstNodeSpaceBefore (node, value) {
	const target = node.first

	if (target.type === `selector`) {
		setFirstNodeSpaceBefore(target, value)
	} else {
		target.spaces.before = value
	}
}

/**
 * @param {import('postcss-selector-parser').Container} node
 * @param {string} value
 * @returns {void}
 */
function setLastNodeSpaceAfter (node, value) {
	const target = node.last

	if (target.type === `selector`) {
		setLastNodeSpaceAfter(target, value)
	} else {
		target.spaces.after = value
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
