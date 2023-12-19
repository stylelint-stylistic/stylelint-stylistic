import stylelint from "stylelint"
import { mutateIdent } from "@csstools/css-tokenizer"

import atRuleParamIndex from "../../utils/atRuleParamIndex.js"
import findMediaFeatureNames from "../../utils/findMediaFeatureNames.js"
import isCustomMediaQuery from "../../utils/isCustomMediaQuery.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `media-feature-name-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, {
		actual: primary,
		possible: [`lower`, `upper`],
	})

	if (!validOptions) {
		return
	}

	root.walkAtRules(/^media$/i, (atRule) => {
		let hasComments = atRule.raws.params?.raw
		let mediaRule = hasComments ? hasComments : atRule.params

		let hasFixes = false

		mediaRule = findMediaFeatureNames(mediaRule, (mediaFeatureNameToken) => {
			const [, , startIndex, endIndex, { value: featureName }] = mediaFeatureNameToken

			if (isCustomMediaQuery(featureName)) {
				return
			}

			const expectedFeatureName =	primary === `lower` ? featureName.toLowerCase() : featureName.toUpperCase()

			if (featureName === expectedFeatureName) {
				return
			}

			if (context.fix) {
				mutateIdent(mediaFeatureNameToken, expectedFeatureName)
				hasFixes = true

				return
			}

			const atRuleIndex = atRuleParamIndex(atRule)

			report({
				message: messages.expected(featureName, expectedFeatureName),
				node: atRule,
				index: atRuleIndex + startIndex,
				endIndex: atRuleIndex + endIndex + 1,
				ruleName,
				result,
			})
		}).stringify()

		if (hasFixes) {
			if (hasComments) {
				if (atRule.raws.params === null) {
					throw new Error(`The \`AtRuleRaws\` node must have a \`params\` property`)
				}

				atRule.raws.params.raw = mediaRule
			} else {
				atRule.params = mediaRule
			}
		}
	})
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
