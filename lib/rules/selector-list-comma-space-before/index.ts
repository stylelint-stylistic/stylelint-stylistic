import type { Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-list-comma-space-before`

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
 * Requires a single space or no whitespace before the commas of selector lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `never`, `always-single-line` or `never-single-line`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		let fixData: Map<Rule, number[]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The run in front of the comma may hold the break closing an inline comment, which no fix may write over
			isFixable: (selector, index, inlineComments) => {
				let runStart = selector.slice(0, index).trimEnd().length

				return !inlineComments.some((inlineComment) => runStart <= inlineComment.endIndex && inlineComment.endIndex < index)
			},
			fix: (ruleNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(ruleNode) || []

				commaIndices.push(index)
				fixData.set(ruleNode, commaIndices)

				return true
			},
		})

		if (fixData) {
			for (let [ruleNode, commaIndices] of fixData.entries()) {
				let copies = syntax.selectorCopies(ruleNode)
				let { selector } = copies

				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = selector.slice(0, index)
					let afterSelector = selector.slice(index)

					if (primary.includes(`always`)) beforeSelector = beforeSelector.replace(TRAILING_CSS_WHITESPACE, ` `)
					else if (primary.includes(`never`)) beforeSelector = beforeSelector.replace(TRAILING_CSS_WHITESPACE, ``)

					selector = beforeSelector + afterSelector
				}

				copies.write(selector)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
