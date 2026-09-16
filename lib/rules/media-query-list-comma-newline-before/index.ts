import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runInFront, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line media query list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the commas of media query lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		let fixData: Map<AtRule, number[]> | undefined

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			// `never-multi-line` may take away the break closing a `//` comment and put the comma into it; report and leave the parameters. `always` only adds a break.
			isFixable: (params, index, atRule, commas) => {
				// The run in front of a comma opening the parameters is `raws.afterName`, the at-rule name rules' to write; a break written into the parameters goes into that raw and is asked for again
				if (index === 0) return false

				let closesInlineComment = syntax.endsWithInlineComment(params.slice(0, index), syntax.inlineComments(atRule, result))

				if (primary === `never-multi-line` && closesInlineComment) return false

				// The space twin writes the same run, save over a comment's closing break (#704)
				return writesTwinRun(shortName, ruleName, atRule, result, {
					side: `before`,
					run: runInFront(params, index),
					lineText: params,
					runs: () => commas.map(({ comma }) => runInFront(params, comma)),
					line: atRule.rangeBy({ index: index + atRuleParamIndex(atRule) }).start.line,
					twinWrites: () => !closesInlineComment,
				})
			},
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

					// The break goes in front of the spaces and tabs standing there, which become the indentation of the comma's line
					if (primary.startsWith(`always`)) {
						let spaceIndex = beforeComma.search(TRAILING_SPACES_AND_TABS)

						beforeComma = spaceIndex >= 0 ? beforeComma.slice(0, spaceIndex) + getLineBreak(root, result) + beforeComma.slice(spaceIndex) : beforeComma + getLineBreak(root, result)
					}
					else if (primary === `never-multi-line`) beforeComma = beforeComma.replace(TRAILING_CSS_WHITESPACE, ``)

					params = beforeComma + afterComma
				}

				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
