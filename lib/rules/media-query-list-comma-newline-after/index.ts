import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE, LEADING_WHITESPACE_WITHOUT_BREAK, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line media query list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace after the commas of media query lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param _secondaryOptions - Unused.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		// Indentation behind the newline is free
		let fixData: Map<AtRule, number[]> | undefined

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			allowTrailingComments: primary.startsWith(`always`),
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
				let params = syntax.read(atRule)

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeComma = params.slice(0, index + 1)
					let afterComma = params.slice(index + 1)

					// Trim to the break already there, adding one only where none stands
					if (primary.startsWith(`always`)) params = OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(afterComma) ? beforeComma + afterComma.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : beforeComma + getLineBreak(syntax, root, result) + afterComma
					else if (primary.startsWith(`never`)) params = beforeComma + afterComma.replace(LEADING_CSS_WHITESPACE, ``)
				}

				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
