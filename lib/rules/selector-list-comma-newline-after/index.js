import styleSearch from "style-search"
import stylelint from "stylelint"

import { LEADING_WHITESPACE, WHITESPACE_THEN_BLOCK_COMMENT, WHITESPACE_THEN_INLINE_COMMENT } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
import { getLineBreak } from "../../utils/getLineBreak/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.js"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace after the commas of selector lists.
 * @type {import('stylelint').RuleBase<'always' | 'always-multi-line' | 'never-multi-line'>}
 */
function rule (primary, _secondaryOptions) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			// The raw selector is what is read, so that an end-of-line comment is allowed, e.g.
			//   a, /* comment */
			//   b {}
			/** @type {import('../../utils/typeGuards/index.js').SyntaxRaw | undefined} */
			let selectorRaws = ruleNode.raws.selector
			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			// `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw read here, keeps the source spelling beside it and prints that one, so the two strings drift apart by two characters per comment. Every position is counted in the raw and reported in the file's own coordinates, and a fix is written to both copies.
			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			/** @type {number[]} */
			let fixIndices = []

			styleSearch(
				{
					source: selector,
					target: `,`,
					functionArguments: `skip`,
				},
				(match) => {
					let nextChars = selector.slice(match.endIndex)

					// An inline comment is closed by a newline and by nothing else, so the newline this rule asks for is already there
					if (WHITESPACE_THEN_INLINE_COMMENT.test(nextChars)) return

					// If there are spaces and then a comment begins, look for the newline
					let indextoCheckAfter = WHITESPACE_THEN_BLOCK_COMMENT.test(nextChars) ? selector.indexOf(`*/`, match.endIndex) + 1 : match.startIndex

					checker.afterOneOnly({
						source: selector,
						index: indextoCheckAfter,
						err: (m) => {
							// Under the `never` options the whitespace behind the comma — or behind the comment standing after it — is taken away, and it may hold the line break that closes an inline comment: without that break everything behind it would land in the comment's text. The problem is reported and the code left as it was. The `always` options only add a break in front of that whitespace, and take nothing.
							let fixIndex = indextoCheckAfter + 1
							let runEnd = fixIndex + (selector.slice(fixIndex).length - selector.slice(fixIndex).trimStart().length)
							let closesInlineComment = primary.startsWith(`never`) && inlineComments.some((inlineComment) => fixIndex <= inlineComment.endIndex && inlineComment.endIndex < runEnd)
							let sourceIndex = toSelectorSourceIndex(match.startIndex, inlineComments)

							report({
								message: m,
								node: ruleNode,
								index: sourceIndex,
								endIndex: sourceIndex,
								result,
								ruleName,
								fix: closesInlineComment
									? undefined
									: () => {
										fixIndices.push(fixIndex)
									},
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

					if (primary.startsWith(`always`)) afterSelector = getLineBreak(root, result) + afterSelector
					else if (primary.startsWith(`never-multi-line`)) afterSelector = afterSelector.replace(LEADING_WHITESPACE, ``)

					fixedSelector = beforeSelector + afterSelector
				}

				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
