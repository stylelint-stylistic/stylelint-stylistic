import styleSearch from "style-search"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.js"
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

/** @type {import('stylelint').Rule} */
function rule (primary, _secondaryOptions, context) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!isStandardSyntaxRule(ruleNode)) return

			// Get raw selector so we can allow end-of-line comments, e.g.
			//   a, /* comment */
			//   b {}
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

					// If there's a // comment, that means there has to be a newline ending the comment so we're fine
					if ((/^\s+\/\//u).test(nextChars)) return

					// If there are spaces and then a comment begins, look for the newline
					let indextoCheckAfter = (/^\s+\/\*/u).test(nextChars) ? selector.indexOf(`*/`, match.endIndex) + 1 : match.startIndex

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

					if (primary.startsWith(`always`)) afterSelector = context.newline + afterSelector
					else if (primary.startsWith(`never-multi-line`)) afterSelector = afterSelector.replace(/^\s*/u, ``)

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
