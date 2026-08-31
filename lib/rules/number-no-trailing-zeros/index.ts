import type { AtRule, Declaration } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { FRACTION_WITH_TRAILING_ZEROS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpanHolding } from "../../utils/findInlineCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `number-no-trailing-zeros`

const MESSAGES = defineMessages({
	rejected: `Unexpected trailing zero(s)`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Disallows trailing zeros in numbers.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, which is `true`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: true): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) return

			check(atRule, syntax.read(atRule))
		})

		root.walkDecls((decl) => check(decl, syntax.read(decl)))

		/**
		 * Checks a node for trailing zeros violations.
		 * @param node - The node to check.
		 * @param value - The value to check.
		 */
		function check (node: AtRule | Declaration, value: string): void {
			let fixPositions: Array<{
				startIndex: number,
				endIndex: number,
			}> = []

			// Get out quickly if there are no periods
			if (!value.includes(`.`)) return

			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = syntax.inlineCommentSpans(value, node, result)

			valueParser(value).walk((valueNode, at, siblings) => {
				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				// Ignore strings, comments, etc
				if (valueNode.type !== `word`) return

				let match = FRACTION_WITH_TRAILING_ZEROS.exec(valueNode.value)

				// `match[1]` is whatever digits stand between the decimal point and the trailing zeros, and may be empty
				// `match[2]` is the trailing zeros themselves
				if (match === null || match[1] === undefined || match[2] === undefined) return

				// The index is made of four parts:
				//  where the value node begins +
				//  where the match begins in it +
				//  one for the decimal point +
				//  the digits standing behind it, which is `match[1]`
				let index = valueNode.sourceIndex + match.index + 1 + match[1].length

				// The start index is that same index, except where the fraction is nothing but zeros: the decimal point goes with them then, so the index steps back one.
				let startIndex = match[1].length > 0 ? index : index - 1

				// The end index is that index plus the run of trailing zeros
				let endIndex = index + match[2].length

				let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

				// this is the index of the _first_ trailing zero
				let problemIndex = baseIndex + index

				report({
					message: messages.rejected,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						fixPositions.unshift({
							startIndex,
							endIndex,
						})
					},
				})
			})

			if (fixPositions.length > 0) {
				for (let fixPosition of fixPositions) {
					let startIndex = fixPosition.startIndex
					let endIndex = fixPosition.endIndex

					if (isAtRule(node)) syntax.write(node, removeTrailingZeros(syntax.read(node), startIndex, endIndex))
					else syntax.write(node, removeTrailingZeros(syntax.read(node), startIndex, endIndex))
				}
			}
		}
	}
}

/**
 * Removes trailing zeros from a number in the specified range.
 * @param input - The input string.
 * @param startIndex - The start index of the range to remove.
 * @param endIndex - The end index of the range to remove.
 * @returns The string with trailing zeros removed.
 */
function removeTrailingZeros (input: string, startIndex: number, endIndex: number): string {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
