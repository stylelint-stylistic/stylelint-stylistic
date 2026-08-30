import type { AtRule, Declaration, Node } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { FRACTION_WITH_LEADING_ZEROS, FRACTION_WITHOUT_LEADING_ZERO } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import { readsInlineComments } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `number-leading-zero`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected a leading zero`,
	rejected: `Unexpected leading zero`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows a leading zero for fractional numbers less than 1.
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

		let fix: FixCallback | undefined

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) return

			check(atRule, getAtRuleParams(atRule))
		})

		root.walkDecls((decl) => check(decl, getDeclarationValue(decl)))

		/**
		 * Checks a node for leading zero violations.
		 * @param node - The node to check.
		 * @param value - The value to check.
		 */
		function check (node: AtRule | Declaration, value: string): void {
			let neverFixPositions: Array<{
				startIndex: number,
				endIndex: number,
			}> = []

			let alwaysFixPositions: Array<{ index: number }> = []

			// Get out quickly if there are no periods
			if (!value.includes(`.`)) return

			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = findInlineCommentSpans(value, readsInlineComments(node, result))

			valueParser(value).walk((valueNode, at, siblings) => {
				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				// Ignore strings, comments, etc
				if (valueNode.type !== `word`) return

				// Check leading zero
				if (primary === `always`) {
					let match = FRACTION_WITHOUT_LEADING_ZERO.exec(valueNode.value)

					if (match === null || match[1] === undefined) return

					// The match reaches back a character to make sure the dot opens a number, so it is one longer than the number itself wherever it did: subtracting the number's length gives the index the dot stands at, which is 1 for `-.5` and 0 for `.5`.
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

					// The match reaches back a character to make sure the zeros open a number, so subtracting the zeros and the fraction behind them from the whole gives the index the first zero stands at, which is 1 for `-00.5` and 0 for `00.5`.
					let zeros = match[1]
					let capturingGroupIndex = match[0].length - (zeros.length + match[2].length)

					let index = valueNode.sourceIndex + match.index + capturingGroupIndex

					fix = (): void => {
						neverFixPositions.unshift({
							startIndex: index,
							// `match[1]` is the run of zeros itself, so its length is how far the fix reaches
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

					if (isAtRule(node)) setAtRuleParams(node, addLeadingZero(getAtRuleParams(node), index))
					else setDeclarationValue(node, addLeadingZero(getDeclarationValue(node), index))
				}
			}

			if (neverFixPositions.length > 0) {
				for (let fixPosition of neverFixPositions) {
					let startIndex = fixPosition.startIndex
					let endIndex = fixPosition.endIndex

					if (isAtRule(node)) setAtRuleParams(node, removeLeadingZeros(getAtRuleParams(node), startIndex, endIndex))
					else setDeclarationValue(node, removeLeadingZeros(getDeclarationValue(node), startIndex, endIndex))
				}
			}
		}

		/**
		 * Reports a leading zero violation.
		 * @param message - The error message to report.
		 * @param node - The node with the violation.
		 * @param index - The index of the violation.
		 */
		function complain (message: string, node: Node, index: number): void {
			report({
				result,
				ruleName,
				message,
				node,
				index,
				endIndex: index,
				fix,
			})
		}
	}
}

/**
 * Adds a leading zero to a number at the specified index.
 * @param input - The input string.
 * @param index - The index at which to add the leading zero.
 * @returns The string with the leading zero added.
 */
function addLeadingZero (input: string, index: number): string {
	return `${input.slice(0, index)}0${input.slice(index)}`
}

/**
 * Removes leading zeros from a number in the specified range.
 * @param input - The input string.
 * @param startIndex - The start index of the range to remove.
 * @param endIndex - The end index of the range to remove.
 * @returns The string with leading zeros removed.
 */
function removeLeadingZeros (input: string, startIndex: number, endIndex: number): string {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
