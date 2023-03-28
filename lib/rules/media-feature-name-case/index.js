import mediaParser from 'postcss-media-query-parser'

import atRuleParamIndex from '../../utils/atRuleParamIndex'
import isCustomMediaQuery from '../../utils/isCustomMediaQuery'
import isRangeContextMediaFeature from '../../utils/isRangeContextMediaFeature'
import isStandardSyntaxMediaFeatureName from '../../utils/isStandardSyntaxMediaFeatureName'
import rangeContextNodeParser from '../rangeContextNodeParser'
import report from '../../utils/report'
import ruleMessages from '../../utils/ruleMessages'
import validateOptions from '../../utils/validateOptions'

export const ruleName = `media-feature-name-case`

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${ actual }" to be "${ expected }"`
})

export const meta = {
	url: `https://stylelint.io/user-guide/rules/media-feature-name-case`,
	fixable: true,
	deprecated: true
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(result, ruleName, {
		actual: primary,
		possible: [`lower`, `upper`]
	})

	if (!validOptions) {
		return
	}

	root.walkAtRules(/^media$/i, (atRule) => {
		let hasComments = atRule.raws.params && atRule.raws.params.raw
		const mediaRule = hasComments ? hasComments : atRule.params

		mediaParser(mediaRule).walk(/^media-feature$/i, (mediaFeatureNode) => {
			const parent = mediaFeatureNode.parent
			const mediaFeatureRangeContext = isRangeContextMediaFeature(parent.value)

			let value
			let sourceIndex

			if (mediaFeatureRangeContext) {
				const parsedRangeContext = rangeContextNodeParser(mediaFeatureNode)

				value = parsedRangeContext.name.value
				sourceIndex = parsedRangeContext.name.sourceIndex
			} else {
				value = mediaFeatureNode.value
				sourceIndex = mediaFeatureNode.sourceIndex
			}

			if (!isStandardSyntaxMediaFeatureName(value) || isCustomMediaQuery(value)) {
				return
			}

			const expectedFeatureName = primary === `lower` ? value.toLowerCase() : value.toUpperCase()

			if (value === expectedFeatureName) {
				return
			}

			if (context.fix) {
				if (hasComments) {
					hasComments =
							hasComments.slice(0, sourceIndex) +
							expectedFeatureName +
							hasComments.slice(sourceIndex + expectedFeatureName.length)

					if (atRule.raws.params === null) {
						throw new Error(`The \`AtRuleRaws\` node must have a \`params\` property`)
					}

					atRule.raws.params.raw = hasComments
				} else {
					atRule.params =
							atRule.params.slice(0, sourceIndex) +
							expectedFeatureName +
							atRule.params.slice(sourceIndex + expectedFeatureName.length)
				}

				return
			}

			report({
				index: atRuleParamIndex(atRule) + sourceIndex,
				message: messages.expected(value, expectedFeatureName),
				node: atRule,
				ruleName,
				result
			})
		})
	})
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
