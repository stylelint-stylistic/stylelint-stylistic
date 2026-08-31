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
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `single` and `double`.
 * @param secondaryOptions - The secondary options: `avoidEscape`.
 * @returns The check, run over every stylesheet the rule is configured for.
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
		 * Checks a rule node for quote violations.
		 * @param ruleNode - The rule node to check.
		 */
		function checkRule (ruleNode: Rule): void {
			if (!syntax.isStandardRule(ruleNode)) return

			let copies = syntax.selectorCopies(ruleNode)

			// `ruleNode.selector` is a copy with every comment taken out, so a position counted in it stands short of the file wherever a comment goes before, and a fix written to it prints without the comments. The raw is the text the file holds — except under `postcss-scss`, which spells every inline comment of the raw as a block one and keeps the file's spelling beside it, two characters shorter per comment. The raw is what is parsed here, every position is translated back into the file's coordinates, and a fix is written to both copies.
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
		 * Checks a declaration or at-rule node for quote violations.
		 * @param node - The node to check.
		 * @param rawValue - The value to check, as the raws of the node record it.
		 * @param getIndex - Function to get the index of the node.
		 */
		function checkDeclOrAtRule<T extends AtRule | Declaration> (node: T, rawValue: string, getIndex: (node: T) => number): void {
			let fixPositions: number[] = []
			let value = rawValue

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) return

			// Where the comments of the text stand is the syntax's to say: off the pair of copies it keeps while the pair is in step, off a scan of the text otherwise
			let inlineCommentSpans = syntax.printedInlineComments(node, value, result)

			if (isAtRule(node) && node.name === `charset`) {
				let hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// pass through to the fixer only if the primary option is "double"
				if (hasValidQuotes || correctQuote === `'`) return
			}

			valueParser(blankComments(value, inlineCommentSpans)).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					let needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// don't consider this an error
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

			// The write lands in every copy the syntax keeps, the raw regenerated from the fixed text the way the syntax itself fills it — which is byte for byte the old raw with the quotes replaced, since a quote the rule fixes never stands inside a comment
			syntax.write(node, replaceQuotes(value, fixPositions))
		}

		/**
		 * Replaces the quotation marks a text carries at the given indexes with the correct one.
		 * @param text - The text to fix.
		 * @param indexes - The indexes of the quotation marks, in the coordinates of the text.
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
 * Replaces a quote character in a string at the specified index.
 * @param string - The input string.
 * @param index - The index at which to replace the quote.
 * @param replace - The replacement quote character.
 * @returns The string with the quote replaced.
 */
function replaceQuote (string: string, index: number, replace: string): string {
	return string.slice(0, index) + replace + string.slice(index + replace.length)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
