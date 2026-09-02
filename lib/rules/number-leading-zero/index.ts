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
 * Requires or disallows a leading zero for fractional numbers less than 1.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
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

			// Every comment the value holds, both kinds. A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind, so what such a comment holds comes back as ordinary words and calls; a block comment reaches the walk as a node of its own — except one opening `/*/`, which the parser closes on the star it opened with, handing the rest of its text back the same way (#378)
			let comments = syntax.commentSpans(value, node, result)

			valueParser(value).walk((valueNode, at, siblings) => {
				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of a comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break or the delimiter that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the comment's end, and what stands there is nothing this rule may read.
				if (findCommentSpanHolding(valueNode, comments)) return

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
				...(fix && { fix }),
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
