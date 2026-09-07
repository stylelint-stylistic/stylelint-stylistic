import styleSearch from "style-search"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE, WHITESPACE_THEN_BLOCK_COMMENT, WHITESPACE_THEN_INLINE_COMMENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line selector list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace after the commas of selector lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param _secondaryOptions - None taken.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			// The raw selector is read, so an end-of-line comment behind the comma is allowed
			let copies = syntax.selectorCopies(ruleNode)
			let { selector } = copies

			let fixIndices: number[] = []

			styleSearch(
				{
					source: selector,
					target: `,`,
					functionArguments: `skip`,
				},
				(match) => {
					let nextChars = selector.slice(match.endIndex)

					// A newline alone closes an inline comment, so the one asked for is there
					if (WHITESPACE_THEN_INLINE_COMMENT.test(nextChars)) return

					// Behind spaces and a block comment, look after the comment
					let indextoCheckAfter = WHITESPACE_THEN_BLOCK_COMMENT.test(nextChars) ? selector.indexOf(`*/`, match.endIndex) + 1 : match.startIndex

					checker.afterOneOnly({
						source: selector,
						index: indextoCheckAfter,
						err: (m) => {
							// A `never` fix may take the break closing an inline comment: reported unfixed. The `always` options take nothing
							let fixIndex = indextoCheckAfter + 1
							let runEnd = fixIndex + (selector.slice(fixIndex).length - selector.slice(fixIndex).trimStart().length)
							let closesInlineComment = primary.startsWith(`never`) && copies.comments.some((inlineComment) => fixIndex <= inlineComment.endIndex && inlineComment.endIndex < runEnd)
							let sourceIndex = copies.toSourceIndex(match.startIndex)

							report({
								message: m,
								node: ruleNode,
								index: sourceIndex,
								endIndex: sourceIndex,
								result,
								ruleName,
								...(!closesInlineComment && {
									fix: (): void => {
										fixIndices.push(fixIndex)
									},
								}),
							})
						},
					})
				},
			)

			if (fixIndices.length > 0) {
				let fixedSelector = selector

				for (let index of fixIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = fixedSelector.slice(0, index)
					let afterSelector = fixedSelector.slice(index)

					if (primary.startsWith(`always`)) afterSelector = getLineBreak(syntax, root, result) + afterSelector
					else if (primary.startsWith(`never-multi-line`)) afterSelector = afterSelector.replace(LEADING_CSS_WHITESPACE, ``)

					fixedSelector = beforeSelector + afterSelector
				}

				copies.write(fixedSelector)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
