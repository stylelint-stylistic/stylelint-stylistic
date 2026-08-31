import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Expected single space before "," in a single-line list`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace before the commas of media query lists.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		let fixData: Map<AtRule, number[]> | undefined

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The comma goes right after this text, and the whitespace run the fix writes ends it. Where an inline comment stands there, the line break that run holds is what closes the comment, so either option would take the comma, and the whole query behind it, into the comment's text: leave the parameters alone and let the warning stand
			isFixable: (params, index, atRule) => !syntax.endsWithInlineComment(params.slice(0, index), syntax.inlineComments(atRule, result)),
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
					let beforeComma = params.slice(0, index)
					let afterComma = params.slice(index)

					if (primary.startsWith(`always`)) params = beforeComma.replace(TRAILING_WHITESPACE, ` `) + afterComma
					else if (primary.startsWith(`never`)) params = beforeComma.replace(TRAILING_WHITESPACE, ``) + afterComma
				}

				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
