import atRuleParamIndex from '../../utils/atRuleParamIndex'
import mediaFeatureColonSpaceChecker from '../mediaFeatureColonSpaceChecker'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'
import whitespaceChecker from '../../utils/whitespaceChecker'

export const ruleName = `media-feature-colon-space-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ":"`,
	rejectedAfter: () => `Unexpected whitespace after ":"`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/media-feature-colon-space-after`,
	fixable: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`]
		})

		if (!validOptions) {
			return
		}

		/** @type {Map<import('postcss').AtRule, number[]> | undefined} */
		let fixData

		mediaFeatureColonSpaceChecker({
			root,
			result,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: context.fix
				? (atRule, index) => {
					const paramColonIndex = index - atRuleParamIndex(atRule)

					fixData = fixData || new Map()
					const colonIndices = fixData.get(atRule) || []

					colonIndices.push(paramColonIndex)
					fixData.set(atRule, colonIndices)

					return true
				}
				: null
		})

		if (fixData) {
			for (const [atRule, colonIndices] of fixData.entries()) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

				for (const index of colonIndices.sort((a, b) => b - a)) {
					const beforeColon = params.slice(0, index + 1)
					const afterColon = params.slice(index + 1)

					if (primary === `always`) {
						params = beforeColon + afterColon.replace(/^\s*/, ` `)
					} else if (primary === `never`) {
						params = beforeColon + afterColon.replace(/^\s*/, ``)
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
