import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

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

		let fixData: Map<AtRule, number[]> | undefined

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
