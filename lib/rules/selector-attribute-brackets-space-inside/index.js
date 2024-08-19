import stylelint from "stylelint"
import styleSearch from "style-search"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxRule from "../../utils/isStandardSyntaxRule.js"
import parseSelector from "../../utils/parseSelector.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-attribute-brackets-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "["`,
	rejectedOpening: `Unexpected whitespace after "["`,
	expectedClosing: `Expected single space before "]"`,
	rejectedClosing: `Unexpected whitespace before "]"`,
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

			if (!ruleNode.selector.includes(`[`)) {
				return
			}

			let selector = ruleNode.raws.selector ? ruleNode.raws.selector.raw : ruleNode.selector

			let fix = null
			let hasFixed
			let fixedSelector = parseSelector(selector, result, ruleNode, (selectorTree) => {
				selectorTree.walkAttributes((attributeNode) => {
					let attributeSelectorString = attributeNode.toString()

					styleSearch({ source: attributeSelectorString, target: `[` }, (match) => {
						let nextCharIsSpace = attributeSelectorString[match.startIndex + 1] === ` `
						let index = attributeNode.sourceIndex + match.startIndex + 1

						if (nextCharIsSpace && primary === `never`) {
							fix = () => {
								hasFixed = true
								fixBefore(attributeNode)
							}

							complain(messages.rejectedOpening, index)
						}

						if (!nextCharIsSpace && primary === `always`) {
							fix = () => {
								hasFixed = true
								fixBefore(attributeNode)
							}

							complain(messages.expectedOpening, index)
						}
					})

					styleSearch({ source: attributeSelectorString, target: `]` }, (match) => {
						let prevCharIsSpace = attributeSelectorString[match.startIndex - 1] === ` `
						let index = attributeNode.sourceIndex + match.startIndex - 1

						if (prevCharIsSpace && primary === `never`) {
							fix = () => {
								hasFixed = true
								fixAfter(attributeNode)
							}

							complain(messages.rejectedClosing, index)
						}

						if (!prevCharIsSpace && primary === `always`) {
							fix = () => {
								hasFixed = true
								fixAfter(attributeNode)
							}

							complain(messages.expectedClosing, index)
						}
					})
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

	/**
	 * @param {import('postcss-selector-parser').Attribute} attributeNode
	 */
	function fixBefore (attributeNode) {
		let spacesAttribute = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
		let rawAttrBefore = spacesAttribute && spacesAttribute.before

		/** @type {{ attrBefore: string, setAttrBefore: (fixed: string) => void }} */
		let { attrBefore, setAttrBefore } = rawAttrBefore
			? {
				attrBefore: rawAttrBefore,
				setAttrBefore (fixed) {
					spacesAttribute.before = fixed
				},
			}
			: {
				attrBefore: (attributeNode.spaces.attribute && attributeNode.spaces.attribute.before) || ``,
				setAttrBefore (fixed) {
					if (!attributeNode.spaces.attribute) { attributeNode.spaces.attribute = {} }

					attributeNode.spaces.attribute.before = fixed
				},
			}

		if (primary === `always`) {
			setAttrBefore(attrBefore.replace(/^\s*/, ` `))
		} else if (primary === `never`) {
			setAttrBefore(attrBefore.replace(/^\s*/, ``))
		}
	}

	/**
	 * @param {import('postcss-selector-parser').Attribute} attributeNode
	 */
	function fixAfter (attributeNode) {
		// eslint-disable-next-line no-nested-ternary
		let key = attributeNode.operator ? attributeNode.insensitive ? `insensitive` : `value` : `attribute`

		let rawSpaces = attributeNode.raws.spaces && attributeNode.raws.spaces[key]
		let rawAfter = rawSpaces && rawSpaces.after

		let spaces = attributeNode.spaces[key]

		/** @type {{ after: string, setAfter: (fixed: string) => void }} */
		let { after, setAfter } = rawAfter
			? {
				after: rawAfter,
				setAfter (fixed) {
					rawSpaces.after = fixed
				},
			}
			: {
				after: (spaces && spaces.after) || ``,
				setAfter (fixed) {
					if (!attributeNode.spaces[key]) { attributeNode.spaces[key] = {} }

					// @ts-expect-error -- TS2532: Object is possibly 'undefined'.
					attributeNode.spaces[key].after = fixed
				},
			}

		if (primary === `always`) {
			setAfter(after.replace(/\s*$/, ` `))
		} else if (primary === `never`) {
			setAfter(after.replace(/\s*$/, ``))
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
