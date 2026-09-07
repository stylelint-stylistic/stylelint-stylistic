import type { AtRule, Declaration } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { FRACTION_WITH_TRAILING_ZEROS } from "../../regexps.ts"
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

let shortName = `number-no-trailing-zeros`

const MESSAGES = defineMessages({
	rejected: `Unexpected trailing zero(s)`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows trailing zeros in numbers.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, { actual: primary })

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (atRule.name.toLowerCase() === `import`) return

			check(atRule, syntax.read(atRule))
		})

		root.walkDecls((decl) => check(decl, syntax.read(decl)))

		/**
		 * Checks a node for trailing zeros.
		 * @param node - The declaration or at-rule the value belongs to.
		 * @param value - Its text as read.
		 */
		function check (node: AtRule | Declaration, value: string): void {
			let fixPositions: Array<{
				startIndex: number,
				endIndex: number,
			}> = []

			// No period, no fraction
			if (!value.includes(`.`)) return

			// The value parser knows nothing of `//` comments and closes `/*/` on its own star (#378)
			let comments = syntax.commentSpans(value, node, result)

			// Quotation marks in comments are masked, so the parser pairs the rest as the file does (#508)
			valueParser(hideQuotesInComments(value, comments)).walk((valueNode, at, siblings) => {
				// An address, not arguments; the name is read as CSS does, so `\75 rl(` counts
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node in a comment is skipped but its children walked, since a call opened in a comment reaches past its end into code; an address likewise, so it is asked first
				if (findCommentSpanHolding(valueNode, comments)) return

				// Words only
				if (valueNode.type !== `word`) return

				let match = FRACTION_WITH_TRAILING_ZEROS.exec(valueNode.value)

				// `match[1]`: the digits between the point and the zeros; `match[2]`: the zeros
				if (match === null || match[1] === undefined || match[2] === undefined) return

				// Node start, match start, the point, then `match[1]`
				let index = valueNode.sourceIndex + match.index + 1 + match[1].length

				// A fraction of nothing but zeros takes the point with it
				let startIndex = match[1].length > 0 ? index : index - 1

				// Past the trailing zeros
				let endIndex = index + match[2].length

				let baseIndex = isAtRule(node) ? atRuleParamIndex(node) : declarationValueIndex(node)

				// The first trailing zero
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

					syntax.write(node, removeTrailingZeros(syntax.read(node), startIndex, endIndex))
				}
			}
		}
	}
}

/**
 * Removes a range from a string.
 * @param input - The string.
 * @param startIndex - Range start.
 * @param endIndex - Range end.
 * @returns The string without the range.
 */
function removeTrailingZeros (input: string, startIndex: number, endIndex: number): string {
	return input.slice(0, startIndex) + input.slice(endIndex)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
