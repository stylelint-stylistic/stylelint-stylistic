import { mutateIdent } from "@csstools/css-tokenizer"
import stylelint from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findMediaFeatureNames } from "../../utils/findMediaFeatureNames/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomMediaQuery } from "../../utils/isCustomMediaQuery/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `media-feature-name-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for media feature names.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let mediaRule = syntax.read(atRule)

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

			if (hasFixes) syntax.write(atRule, mediaRule)
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
