import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.js"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `media-query-list-comma-space-before`

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
 * Requires a single space or disallows whitespace before the commas of media query lists.
 * @type {import('stylelint').RuleBase<'always' | 'never' | 'always-single-line' | 'never-single-line'>}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		/** @type {Map<import('postcss').AtRule, number[]> | undefined} */
		let fixData

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The comma goes right after this text, and the whitespace run the fix writes ends it. Where an inline comment stands there, the line break that run holds is what closes the comment, so either option would take the comma, and the whole query behind it, into the comment's text: leave the parameters alone and let the warning stand
			isFixable: (params, index, atRule) => !endsWithInlineComment(params.slice(0, index), inlineCommentReading(atRule, result)),
			fix: (atRule, index) => {
				let paramCommaIndex = index - atRuleParamIndex(atRule)

				fixData = fixData || (new Map())

				let commaIndices = fixData.get(atRule) || []

				commaIndices.push(paramCommaIndex)
				fixData.set(atRule, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (let [atRule, commaIndices] of fixData.entries()) {
				let params = getAtRuleParams(atRule)

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeComma = params.slice(0, index)
					let afterComma = params.slice(index)

					if (primary.startsWith(`always`)) params = beforeComma.replace(TRAILING_WHITESPACE, ` `) + afterComma
					else if (primary.startsWith(`never`)) params = beforeComma.replace(TRAILING_WHITESPACE, ``) + afterComma
				}

				setAtRuleParams(atRule, params)
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
