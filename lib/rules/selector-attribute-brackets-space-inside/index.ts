import type { Attribute } from "postcss-selector-parser"
import styleSearch from "style-search"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_WHITESPACE, TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.ts"
import type { SyntaxRaw } from "../../utils/typeGuards/index.ts"

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
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			let selectorRaws: SyntaxRaw | undefined = ruleNode.raws.selector

			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			if (!selector.includes(`[`)) return

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw parsed here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			let fix: FixCallback | undefined
			let hasFixed
			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkAttributes((attributeNode) => {
				let attributeSelectorString = attributeNode.toString()

				styleSearch({ source: attributeSelectorString, target: `[` }, (match) => {
					let nextCharIsSpace = attributeSelectorString[match.startIndex + 1] === ` `
					let index = attributeNode.sourceIndex + match.startIndex + 1

					if (nextCharIsSpace && primary === `never`) {
						fix = (): void => {
							hasFixed = true
							fixBefore(attributeNode)
						}

						complain(messages.rejectedOpening, index)
					}

					if (!nextCharIsSpace && primary === `always`) {
						fix = (): void => {
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
						fix = (): void => {
							hasFixed = true
							fixAfter(attributeNode)
						}

						complain(messages.rejectedClosing, index)
					}

					if (!prevCharIsSpace && primary === `always`) {
						fix = (): void => {
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
			 * @param message - The error message to report.
			 * @param index - The index of the violation.
			 */
			function complain (message: string, index: number): void {
				let sourceIndex = toSelectorSourceIndex(index, inlineComments)

				report({
					message,
					index: sourceIndex,
					endIndex: sourceIndex,
					result,
					ruleName,
					node: ruleNode,
					...(fix && { fix }),
				})
			}
		})
	}

	/**
	 * Fixes the space before an attribute selector.
	 * @param attributeNode - The attribute node to fix.
	 */
	function fixBefore (attributeNode: Attribute): void {
		let spacesAttribute = attributeNode.raws.spaces && attributeNode.raws.spaces.attribute
		let rawAttrBefore = spacesAttribute && spacesAttribute.before

		let { attrBefore, setAttrBefore }: {
			attrBefore: string,
			setAttrBefore: (fixed: string) => void,
		} = spacesAttribute && rawAttrBefore
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
	 * @param attributeNode - The attribute node to fix.
	 */
	function fixAfter (attributeNode: Attribute): void {
		let key: `insensitive` | `value` | `attribute` = attributeNode.operator ? (attributeNode.insensitive ? `insensitive` : `value`) : `attribute`

		let rawSpaces = attributeNode.raws.spaces && attributeNode.raws.spaces[key]
		let rawAfter = rawSpaces && rawSpaces.after

		let spaces = attributeNode.spaces[key]

		let { after, setAfter }: {
			after: string,
			setAfter: (fixed: string) => void,
		} = rawSpaces && rawAfter
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
