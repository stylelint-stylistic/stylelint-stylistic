import atRuleParamIndex from '../../utils/atRuleParamIndex'
import mediaQueryListCommaWhitespaceChecker from '../mediaQueryListCommaWhitespaceChecker'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `media-query-list-comma-space-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/media-query-list-comma-space-after`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`]
		})

		if (!validOptions) {
			return
		}

		/** @type {Map<import('postcss').AtRule, number[]> | undefined} */
		let fixData

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
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
						params = beforeComma + afterComma.replace(/^\s*/, ` `)
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
