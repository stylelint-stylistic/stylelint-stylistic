import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaFeatureColonSpaceChecker } from "../../utils/mediaFeatureColonSpaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-feature-colon-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ":"`,
	rejectedAfter: () => `Unexpected whitespace after ":"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the colon in media features.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		let fixData: Map<AtRule, number[]> | undefined

		mediaFeatureColonSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			fix: (atRule, index) => {
				let paramColonIndex = index - atRuleParamIndex(atRule)

				fixData = fixData || (new Map())

				let colonIndices = fixData.get(atRule) || []

				colonIndices.push(paramColonIndex)
				fixData.set(atRule, colonIndices)

				return true
			},
		})

		if (fixData) {
			for (let [atRule, colonIndices] of fixData.entries()) {
				let params = syntax.read(atRule)

				for (let index of colonIndices.toSorted((a, b) => b - a)) {
					let beforeColon = params.slice(0, index + 1)
					let afterColon = params.slice(index + 1)

					if (primary === `always`) params = beforeColon + afterColon.replace(LEADING_WHITESPACE, ` `)
					else if (primary === `never`) params = beforeColon + afterColon.replace(LEADING_WHITESPACE, ``)
				}

				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
