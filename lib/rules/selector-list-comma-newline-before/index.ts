import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS, TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the commas of selector lists.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		let fixData: Map<import("postcss").Rule, number[]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			// Under `never-multi-line` the whitespace in front of the comma is taken away, and it may hold the line break that closes an inline comment: without that break the comma, and the rest of the list, would land in the comment's text. The problem is reported and the code left as it was. `always` only adds a break in front of whatever whitespace stands there, and takes nothing.
			isFixable: (selector, index, inlineComments) => {
				if (primary !== `never-multi-line`) return true

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

					if (primary.startsWith(`always`)) {
						let spaceIndex = beforeSelector.search(TRAILING_SPACES_AND_TABS)

						beforeSelector = spaceIndex >= 0 ? beforeSelector.slice(0, spaceIndex) + getLineBreak(root, result) + beforeSelector.slice(spaceIndex) : beforeSelector + getLineBreak(root, result)
					}
					else if (primary === `never-multi-line`) beforeSelector = beforeSelector.replace(TRAILING_WHITESPACE, ``)

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
