import type { AtRule, Declaration, Rule } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"
import { assertString, isBoolean } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `string-quotes`

const MESSAGES = defineMessages({
	expected: (q) => `Expected ${q} quotes`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const SINGLE_QUOTE = `'`
const DOUBLE_QUOTE = `"`

/**
 * Specifies single or double quotes around strings.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `single` or `double`.
 * @param secondaryOptions - `avoidEscape`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `single` | `double`, secondaryOptions: { avoidEscape?: boolean }): RuleCheck {
	let correctQuote: typeof SINGLE_QUOTE | typeof DOUBLE_QUOTE = primary === `single` ? SINGLE_QUOTE : DOUBLE_QUOTE

	let erroneousQuote: typeof SINGLE_QUOTE | typeof DOUBLE_QUOTE = primary === `single` ? DOUBLE_QUOTE : SINGLE_QUOTE

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`single`, `double`],
			},
			{
				actual: secondaryOptions,
				possible: {
					avoidEscape: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let avoidEscape = secondaryOptions && secondaryOptions.avoidEscape !== undefined ? secondaryOptions.avoidEscape : true

		root.walk((node) => {
			switch (node.type) {
				case `atrule`:
					checkDeclOrAtRule(node, syntax.read(node), atRuleParamIndex)
					break
				case `decl`:
					checkDeclOrAtRule(node, syntax.read(node), declarationValueIndex)
					break
				case `rule`:
					checkRule(node)
					break
				// no default
			}
		})

		/**
		 * Checks the attribute selectors of a rule.
		 * @param ruleNode - The rule whose selector is checked.
		 */
		function checkRule (ruleNode: Rule): void {
			if (!syntax.isStandardRule(ruleNode)) return

			let copies = syntax.selectorCopies(ruleNode)

			// `ruleNode.selector` lacks the comments, so a fix written to it drops them; the raw is parsed, positions translated back, and the fix written to both copies.
			let { selector } = copies

			if (!selector.includes(`[`) || !selector.includes(`=`)) return

			let selectorFixed = false

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkAttributes((attributeNode) => {
				if (!attributeNode.quoted) return

				let maybeProblemIndex = copies.toSourceIndex(attributeNode.sourceIndex + attributeNode.offsetOf(`value`))

				if (attributeNode.quoteMark === correctQuote && avoidEscape) {
					assertString(attributeNode.value)

					let needsCorrectEscape = attributeNode.value.includes(correctQuote)
					let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

					if (needsOtherEscape) return

					if (needsCorrectEscape) {
						report({
							message: messages.expected,
							messageArgs: [primary === `single` ? `double` : primary],
							node: ruleNode,
							index: maybeProblemIndex,
							endIndex: maybeProblemIndex,
							result,
							ruleName,
							fix () {
								selectorFixed = true
								attributeNode.quoteMark = erroneousQuote
							},
						})
					}
				}

				if (attributeNode.quoteMark === erroneousQuote) {
					if (avoidEscape) {
						assertString(attributeNode.value)

						let needsCorrectEscape = attributeNode.value.includes(correctQuote)
						let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

						if (needsOtherEscape) {
							report({
								message: messages.expected,
								messageArgs: [primary],
								node: ruleNode,
								index: maybeProblemIndex,
								endIndex: maybeProblemIndex,
								result,
								ruleName,
								fix () {
									selectorFixed = true
									attributeNode.quoteMark = correctQuote
								},
							})

							return
						}

						if (needsCorrectEscape) return
					}

					report({
						message: messages.expected,
						messageArgs: [primary],
						node: ruleNode,
						index: maybeProblemIndex,
						endIndex: maybeProblemIndex,
						result,
						ruleName,
						fix () {
							selectorFixed = true
							attributeNode.quoteMark = correctQuote
						},
					})
				}
			})

			if (selectorFixed) {
				let fixedSelector = String(selectorTree)

				copies.write(fixedSelector)
			}
		}

		/**
		 * Checks the strings of a value or of at-rule params.
		 * @param node - The declaration or at-rule the value or params belong to.
		 * @param rawValue - The value as the file spells it.
		 * @param getIndex - Returns the index the value starts at.
		 */
		function checkDeclOrAtRule<T extends AtRule | Declaration> (node: T, rawValue: string, getIndex: (node: T) => number): void {
			let fixPositions: number[] = []
			let value = rawValue

			// No erroneous quote, nothing to do
			if (!value.includes(erroneousQuote)) return

			// Blanked, since the value parser closes `/*/` on its own star and reads the rest as value nodes (#378)
			let commentSpans = syntax.printedComments(node, value, result)

			if (isAtRule(node) && node.name === `charset`) {
				let hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// Only a `double` option fixes it; `@charset` takes double quotes alone
				if (hasValidQuotes || correctQuote === `'`) return
			}

			valueParser(blankComments(value, commentSpans)).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					let needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// Not an error
						return
					}

					let openIndex = valueNode.sourceIndex
					let problemIndex = getIndex(node) + openIndex

					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							// An escape is left as the file spells it
							if (!needsEscape) {
								let closeIndex = openIndex + valueNode.value.length + erroneousQuote.length

								fixPositions.push(openIndex, closeIndex)
							}
						},
					})
				}
			})

			if (fixPositions.length === 0) return

			// A fixed quote never stands inside a comment, so the old raw with the quotes replaced is written to every copy
			syntax.write(node, replaceQuotes(value, fixPositions))
		}

		/**
		 * Replaces the marks at the indexes with the correct one.
		 * @param text - The value or params the marks stand in.
		 * @param indexes - The mark indexes.
		 * @returns The fixed text.
		 */
		function replaceQuotes (text: string, indexes: number[]): string {
			let fixed = text

			for (let index of indexes) fixed = replaceQuote(fixed, index, correctQuote)

			return fixed
		}
	}
}

/**
 * Replaces the quote at an index.
 * @param string - The text.
 * @param index - The offset of the quote to replace.
 * @param replace - The replacement.
 * @returns The text, replaced.
 */
function replaceQuote (string: string, index: number, replace: string): string {
	return string.slice(0, index) + replace + string.slice(index + replace.length)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
