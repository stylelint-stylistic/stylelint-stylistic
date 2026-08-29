import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `selector-list-comma-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Expected single space before "," in a single-line list`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the commas of selector lists.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		let fixData: Map<import("postcss").Rule, number[]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The whitespace in front of the comma may hold the line break that closes an inline comment, and that break is nothing a fix may write over: taking it away or replacing it with the space `always` asks for would carry the comma, and the rest of the list, into the comment's text. The problem is reported and the code left as it was.
			isFixable: (selector, index, inlineComments) => {
				let runStart = selector.slice(0, index).trimEnd().length

				return !inlineComments.some((inlineComment) => runStart <= inlineComment.endIndex && inlineComment.endIndex < index)
			},
			fix: (ruleNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(ruleNode) || []

				commaIndices.push(index)
				fixData.set(ruleNode, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (let [ruleNode, commaIndices] of fixData.entries()) {
				let selectorRaws: import("../../utils/typeGuards/index.ts").SyntaxRaw | undefined = ruleNode.raws.selector
				let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

				// The comments are read off the two spellings before anything is written, since the alignment the pair is read by holds only while the copies tell one story.
				let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = selector.slice(0, index)
					let afterSelector = selector.slice(index)

					if (primary.includes(`always`)) beforeSelector = beforeSelector.replace(TRAILING_WHITESPACE, ` `)
					else if (primary.includes(`never`)) beforeSelector = beforeSelector.replace(TRAILING_WHITESPACE, ``)

					selector = beforeSelector + afterSelector
				}

				if (selectorRaws) {
					selectorRaws.raw = selector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(selector, inlineComments)
				}
				else ruleNode.selector = selector
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
