import type { Rule } from "postcss"
import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import type { SyntaxRaw } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `selector-list-comma-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the commas of selector lists.
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

		let fixData: Map<Rule, number[]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
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
				let selectorRaws: SyntaxRaw | undefined = ruleNode.raws.selector
				let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

				// The comments are read off the two spellings before anything is written, since the alignment the pair is read by holds only while the copies tell one story.
				let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = selector.slice(0, index + 1)
					let afterSelector = selector.slice(index + 1)

					if (primary.startsWith(`always`)) afterSelector = afterSelector.replace(LEADING_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) afterSelector = afterSelector.replace(LEADING_WHITESPACE, ``)

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
