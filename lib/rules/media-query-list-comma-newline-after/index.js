import atRuleParamIndex from '../../utils/atRuleParamIndex'
import mediaQueryListCommaWhitespaceChecker from '../mediaQueryListCommaWhitespaceChecker'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `media-query-list-comma-newline-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/media-query-list-comma-newline-after`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`]
		})

		if (!validOptions) {
			return
		}

		// Only check for the newline after the comma, while allowing
		// arbitrary indentation after the newline
		/** @type {Map<import('postcss').AtRule, number[]> | undefined} */
		let fixData

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			allowTrailingComments: primary.startsWith(`always`),
			fix: context.fix
				? (atRule, index) => {
					const paramCommaIndex = index - atRuleParamIndex(atRule)

					fixData = fixData || new Map()
					const commaIndices = fixData.get(atRule) || []

					commaIndices.push(paramCommaIndex)
					fixData.set(atRule, commaIndices)

					return true
				}
				: null
		})

		if (fixData) {
			for (const [atRule, commaIndices] of fixData.entries()) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

				for (const index of commaIndices.sort((a, b) => b - a)) {
					const beforeComma = params.slice(0, index + 1)
					const afterComma = params.slice(index + 1)

					if (primary.startsWith(`always`)) {
						params = /^\s*\n/.test(afterComma)
							? beforeComma + afterComma.replace(/^[^\S\r\n]*/, ``)
							: beforeComma + context.newline + afterComma
					} else if (primary.startsWith(`never`)) {
						params = beforeComma + afterComma.replace(/^\s*/, ``)
					}
				}

				if (atRule.raws.params) {
					atRule.raws.params.raw = params
				} else {
					atRule.params = params
				}
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
