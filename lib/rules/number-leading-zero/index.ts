import type { AtRule, Declaration, Node } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { FRACTION_WITH_LEADING_ZEROS, FRACTION_WITHOUT_LEADING_ZERO } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `number-leading-zero`

const MESSAGES = defineMessages({
	expected: `Expected a leading zero`,
	rejected: `Unexpected leading zero`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows a leading zero for fractions less than 1.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always` or `never`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		let fix: FixCallback | undefined

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) return

			check(atRule, syntax.read(atRule))
		})

		root.walkDecls((decl) => check(decl, syntax.read(decl)))

		/**
		 * Checks a node's value.
		 * @param node - The declaration or at-rule the value belongs to.
		 * @param value - The text as the syntax reads it.
		 */
		function check (node: AtRule | Declaration, value: string): void {
			let neverFixPositions: Array<{
				startIndex: number,
				endIndex: number,
			}> = []

			let alwaysFixPositions: Array<{ index: number }> = []

			// No fraction
			if (!value.includes(`.`)) return

			// Every comment, both kinds; the value parser reads a `//` comment as words, and closes `/*/` on its own star (#378)
			let comments = syntax.commentSpans(value, node, result)

			// Quotation marks a comment leaves open are masked (#508)
			valueParser(hideQuotesInComments(value, comments)).walk((valueNode, at, siblings) => {
				// A call opening an address is passed over whole; the name is read, not matched, so `u\rl(` and `URL(` are `url(`
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node inside a comment is no node of the value, but its children are walked, since a call opened in a comment gathers code past its end; such a `url()` is turned away first
				if (findCommentSpanHolding(valueNode, comments)) return

				// Only words carry numbers
				if (valueNode.type !== `word`) return

				// Check leading zero
				if (primary === `always`) {
					let match = FRACTION_WITHOUT_LEADING_ZERO.exec(valueNode.value)

					if (match === null || match[1] === undefined) return

					// The match reaches back a character, so the dot's index is the whole less the number
					let capturingGroupIndex = match[0].length - match[1].length

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = (): void => {
						alwaysFixPositions.unshift({
							index,
						})
					}

					let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

					complain(messages.expected, node, baseIndex + index)
				}

				if (primary === `never`) {
					let match = FRACTION_WITH_LEADING_ZEROS.exec(valueNode.value)

					if (match === null || match[1] === undefined || match[2] === undefined) return

					// The match reaches back a character, so the first zero's index is the whole less zeros and fraction
					let zeros = match[1]
					let capturingGroupIndex = match[0].length - (zeros.length + match[2].length)

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = (): void => {
						neverFixPositions.unshift({
							startIndex: index,
							// Over the run of zeros
							endIndex: index + zeros.length,
						})
					}

					let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

					complain(messages.rejected, node, baseIndex + index)
				}
			})

			if (alwaysFixPositions.length > 0) {
				for (let fixPosition of alwaysFixPositions) {
					let index = fixPosition.index

					syntax.write(node, addLeadingZero(syntax.read(node), index))
				}
			}

			if (neverFixPositions.length > 0) {
				for (let fixPosition of neverFixPositions) {
					let startIndex = fixPosition.startIndex
					let endIndex = fixPosition.endIndex

					syntax.write(node, removeLeadingZeros(syntax.read(node), startIndex, endIndex))
				}
			}
		}

		/**
		 * Reports a violation.
		 * @param message - The warning text to report.
		 * @param node - The declaration or at-rule reported on.
		 * @param index - The index in the node.
		 */
		function complain (message: string, node: Node, index: number): void {
			report({
				result,
				ruleName,
				message,
				node,
				index,
				endIndex: index,
				...(fix && { fix }),
			})
		}
	}
}

/**
 * Inserts a zero at an index.
 * @param input - The text.
 * @param index - Where the zero goes.
 * @returns The text with the zero.
 */
function addLeadingZero (input: string, index: number): string {
	return `${input.slice(0, index)}0${input.slice(index)}`
}

/**
 * Removes a range of leading zeros.
 * @param input - The text.
 * @param startIndex - The range's start.
 * @param endIndex - The range's end.
 * @returns The text without the range.
 */
function removeLeadingZeros (input: string, startIndex: number, endIndex: number): string {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
