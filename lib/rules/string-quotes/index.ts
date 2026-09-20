import type { AtRule, Declaration, Rule } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex, atRuleParamPrefix } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex, declarationValuePrefix } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import type { AddressSpan } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideParenthesesInUrlStrings } from "../../utils/hideParenthesesInUrlStrings/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
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

/** The mask written over a quotation mark the value parser misreads: `?` opens and closes nothing. */
const MASK = `?`

/**
 * Finds the token a position stands in.
 * @param index - The position.
 * @param spans - The spans of the parentheses the tokenizer read as one token.
 * @returns The span, or nothing.
 */
function tokenAt (index: number, spans: AddressSpan[]): AddressSpan | undefined {
	return spans.find(({ start, end }) => index >= start && index < end)
}

/**
 * Finds the marks the value parser pairs otherwise than the tokenizer does: those of a string it never closed, and those of one whose two marks do not stand in the same token. Only the mark standing inside a token is given back, since that is the one the tokenizer reads as a character of an address; its partner outside is a mark of the value, and masking it would take the string it really opens away.
 * @param text - The value or params as the walk reads it.
 * @param spans - The spans of the parentheses the tokenizer read as one token.
 * @returns The indexes, in source order.
 */
function misreadMarks (text: string, spans: AddressSpan[]): number[] {
	let found: number[] = []

	valueParser(text).walk((valueNode) => {
		if (valueNode.type !== `string`) return

		let openIndex = valueNode.sourceIndex
		let closeIndex = valueNode.sourceEndIndex - 1
		let openToken = tokenAt(openIndex, spans)
		let closeToken = valueNode.unclosed ? undefined : tokenAt(closeIndex, spans)

		if (!valueNode.unclosed && openToken === closeToken) return

		if (openToken) found.push(openIndex)
		if (closeToken) found.push(closeIndex)
	})

	return found
}

/**
 * Masks every mark {@link misreadMarks} names, and reads the text again while any is left, since a mask brings the marks behind it back into the pairing the tokenizer reads. The mask keeps the width, so the parse indexes count in the text the fix is written to.
 * @param text - The value or params as the rule walks it, its comments blanked and the parentheses of a `url( ` hidden, so that this reads the parse the walk reads.
 * @param spans - The spans of the parentheses the tokenizer read as one token.
 * @returns The masked text.
 */
function maskMisreadMarks (text: string, spans: AddressSpan[]): string {
	if (spans.length === 0) return text

	let masked = text

	for (let found = misreadMarks(masked, spans); found.length > 0; found = misreadMarks(masked, spans)) {
		let characters = masked.split(``)

		for (let index of found) {
			if (characters[index] !== SINGLE_QUOTE && characters[index] !== DOUBLE_QUOTE) return masked

			characters[index] = MASK
		}

		masked = characters.join(``)
	}

	return masked
}

/** `single` or `double`, the quotes a string is wrapped in. */
export type PrimaryOption = `single` | `double`

/** The secondary options. */
export type SecondaryOptions = {

	/** Whether a string holding the configured quote may keep the other one; `true` by default. */
	avoidEscape?: boolean,
}

/**
 * Specifies single or double quotes around strings.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
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
					checkDeclOrAtRule(node, syntax.read(node), atRuleParamIndex, atRuleParamPrefix)
					break
				case `decl`:
					checkDeclOrAtRule(node, syntax.read(node), declarationValueIndex, declarationValuePrefix)
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
		 * @param getPrefix - Returns what the node spells in front of the value, which the tokenizer is read over too.
		 */
		function checkDeclOrAtRule<T extends AtRule | Declaration> (node: T, rawValue: string, getIndex: (node: T) => number, getPrefix: (node: T) => string): void {
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

			// The parentheses behind a `url` parted from its `(` are one token to the tokenizer, and the marks the value parser pairs across such a token's edge are masked, so that a fix rewrites the marks the tokenizer pairs (1789653630)
			let addressTokens = syntax.addressTokenSpans(getPrefix(node), value, node, result)

			// The value is passed over where the parser's own tokenizer is out of reach: which marks of it are an address's cannot be said, and a fix written blind leaves a text that parser refuses
			if (!addressTokens) return

			valueParser(maskMisreadMarks(hideParenthesesInUrlStrings(blankComments(value, commentSpans), commentSpans), addressTokens)).walk((valueNode, index, siblings) => {
				// A bare address is passed over whole where the syntax reads a quotation mark inside one as a character of it, since the parser opens an address behind the name spelled `url` alone and hands the strings behind `URL(`, `u\rl(` and `\75 rl(` back as strings (1789604002). A quoted address is the string, and is walked.
				if (valueNode.type === `function` && !syntax.readsQuoteInsideAddressAsString() && opensAnAddress(valueNode, index, siblings) && valueNode.nodes[0]?.type !== `string`) return false

				// A string the value never closes has no mark to replace, and a mark written where the parser read none leaves a text it refuses
				if (valueNode.type === `string` && valueNode.unclosed) return

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
