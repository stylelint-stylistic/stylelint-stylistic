import stylelint from "stylelint"

import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import mediaFeatureColonSpaceChecker from "../../utils/mediaFeatureColonSpaceChecker.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { ruleMessages, validateOptions } } = stylelint

const shortName = `media-feature-colon-space-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) {
			return
		}

		/** @type {Map<import('postcss').AtRule, number[]> | undefined} */
		let fixData

		mediaFeatureColonSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			fix: context.fix ? (atRule, index) => {
				const paramColonIndex = index - atRuleParamIndex(atRule)

				fixData = fixData || new Map()
				const colonIndices = fixData.get(atRule) || []

				colonIndices.push(paramColonIndex)
				fixData.set(atRule, colonIndices)

				return true
			} : null,
		})

		if (fixData) {
			for (const [atRule, colonIndices] of fixData.entries()) {
				let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

				for (const index of colonIndices.sort((a, b) => b - a)) {
					const beforeColon = params.slice(0, index)
					const afterColon = params.slice(index)

					if (primary === `always`) {
						params = beforeColon.replace(/\s*$/, ` `) + afterColon
					} else if (primary === `never`) {
						params = beforeColon.replace(/\s*$/, ``) + afterColon
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
