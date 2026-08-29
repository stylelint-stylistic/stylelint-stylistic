import { mutateIdent } from "@csstools/css-tokenizer"
import stylelint from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { findMediaFeatureNames } from "../../utils/findMediaFeatureNames/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isCustomMediaQuery } from "../../utils/isCustomMediaQuery/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `media-feature-name-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for media feature names.
 * @type {import('stylelint').RuleBase<'lower' | 'upper'>}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let mediaRule = getAtRuleParams(atRule)

			let hasFixes = false

			mediaRule = findMediaFeatureNames(mediaRule, (mediaFeatureNameToken) => {
				let [, , startIndex, endIndex, { value: featureName }] = mediaFeatureNameToken

				if (isCustomMediaQuery(featureName)) return

				let expectedFeatureName = primary === `lower` ? featureName.toLowerCase() : featureName.toUpperCase()

				if (featureName === expectedFeatureName) return

				let atRuleIndex = atRuleParamIndex(atRule)

				report({
					message: messages.expected,
					messageArgs: [featureName, expectedFeatureName],
					node: atRule,
					index: atRuleIndex + startIndex,
					endIndex: atRuleIndex + endIndex + 1,
					ruleName,
					result,
					fix () {
						mutateIdent(mediaFeatureNameToken, expectedFeatureName)
						hasFixes = true
					},
				})
			}).stringify()

			if (hasFixes) setAtRuleParams(atRule, mediaRule)
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
