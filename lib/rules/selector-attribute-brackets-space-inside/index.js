import styleSearch from "style-search"
import stylelint from "stylelint"

import { LEADING_WHITESPACE, TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"

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

/**
 * Requires a single space or disallows whitespace on the inside of the brackets within attribute selectors.
 * @type {import('stylelint').RuleBase<'always' | 'never'>}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			/** @type {import('../../utils/typeGuards/index.js').SyntaxRaw | undefined} */
			let selectorRaws = ruleNode.raws.selector

			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			if (!selector.includes(`[`)) return

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			/** @type {import('stylelint').FixCallback | undefined} */
			let fix
			let hasFixed
			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

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

			if (hasFixed) {
				let fixedSelector = String(selectorTree)

				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}

			/**
			 * Reports an attribute brackets space violation.
			 * @param {string} message - The error message to report.
			 * @param {number} index - The index of the violation.
			 */
			function complain (message, index) {
				let sourceIndex = toSelectorSourceIndex(index, inlineComments)

				report({
					message,
					index: sourceIndex,
					endIndex: sourceIndex,
					result,
					ruleName,
					node: ruleNode,
					fix,
				})
			}
		})
	}

	/**
	 * Fixes the space before an attribute selector.
	 * @param {import('postcss-selector-parser').Attribute} attributeNode - The attribute node to fix.
	 */
	function fixBefore (attributeNode) {
		let spacesAttribute = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
		let rawAttrBefore = spacesAttribute && spacesAttribute.before

		/** @type {{ attrBefore: string, setAttrBefore: (fixed: string) => void }} */
		let { attrBefore, setAttrBefore } = spacesAttribute && rawAttrBefore
			? {
				attrBefore: rawAttrBefore,
				setAttrBefore (fixed) {
					spacesAttribute.before = fixed
				},
			}
			: {
				attrBefore: (attributeNode.spaces.attribute && attributeNode.spaces.attribute.before) || ``,
				setAttrBefore (fixed) {
					if (!attributeNode.spaces.attribute) attributeNode.spaces.attribute = {}

					attributeNode.spaces.attribute.before = fixed
				},
			}

		if (primary === `always`) setAttrBefore(attrBefore.replace(LEADING_WHITESPACE, ` `))
		else if (primary === `never`) setAttrBefore(attrBefore.replace(LEADING_WHITESPACE, ``))
	}

	/**
	 * Fixes the space after an attribute selector.
	 * @param {import('postcss-selector-parser').Attribute} attributeNode - The attribute node to fix.
	 */
	function fixAfter (attributeNode) {
		/** @type {'insensitive' | 'value' | 'attribute'} */
		let key = attributeNode.operator ? (attributeNode.insensitive ? `insensitive` : `value`) : `attribute`

		let rawSpaces = attributeNode.raws.spaces && attributeNode.raws.spaces[key]
		let rawAfter = rawSpaces && rawSpaces.after

		let spaces = attributeNode.spaces[key]

		/** @type {{ after: string, setAfter: (fixed: string) => void }} */
		let { after, setAfter } = rawSpaces && rawAfter
			? {
				after: rawAfter,
				setAfter (fixed) {
					rawSpaces.after = fixed
				},
			}
			: {
				after: (spaces && spaces.after) || ``,
				setAfter (fixed) {
					let written = attributeNode.spaces[key] ?? {}

					written.after = fixed
					attributeNode.spaces[key] = written
				},
			}

		if (primary === `always`) setAfter(after.replace(TRAILING_WHITESPACE, ` `))
		else if (primary === `never`) setAfter(after.replace(TRAILING_WHITESPACE, ``))
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
