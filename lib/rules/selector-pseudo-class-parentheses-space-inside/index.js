import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import parseSelector from "../../utils/parseSelector.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-pseudo-class-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
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
			let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector
			let fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkPseudos((pseudoNode) => {
					if (!pseudoNode.length) {
						return
					}

					let paramString = pseudoNode.map((node) => String(node)).join(`,`)
					let nextCharIsSpace = paramString.startsWith(` `)
					let openIndex = pseudoNode.sourceIndex + pseudoNode.value.length + 1

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

					let prevCharIsSpace = paramString.endsWith(` `)
					let closeIndex = openIndex + paramString.length - 1

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
	let target = node.first

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
	let target = node.last

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
