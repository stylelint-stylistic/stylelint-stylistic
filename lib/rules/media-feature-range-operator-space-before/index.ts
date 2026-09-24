import stylelint from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findMediaOperator } from "../../utils/findMediaOperator/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-feature-range-operator-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before range operator`,
	rejectedBefore: () => `Unexpected whitespace before range operator`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the range operator, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace before the range operator in media features.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
			let fixOperators: [number, string][] = []

			// The run is read and cut over the copy with its escapes masked, so the space of `a\ >b` is not cut
			findMediaOperator(syntax, atRule, result, (match, params, node, runString) => {
				let problemIndex = match.startIndex - 1 + atRuleParamIndex(node)

				// The match holds the character in front of the operator too
				checker.before({
					source: runString,
					index: match.startIndex,
					err: (message) => {
						let run = runInFront(runString, match.startIndex)

						// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎>b` would come out as `a\>b`, one identifier, or `a\ >b`, an escaped space, so the warning stands
						let isFixable = editKeepsEscapedCharacter(params, { start: match.startIndex - run.length, end: match.startIndex, text: primary === `always` ? ` ` : `` })

						report({
							message,
							node,
							index: problemIndex,
							endIndex: problemIndex,
							result,
							ruleName,
							...(isFixable && {
								fix (): void {
									fixOperators.push([match.startIndex, run])
								},
							}),
						})
					},
				})
			})

			if (fixOperators.length > 0) {
				let params = syntax.read(atRule)

				for (let [index, run] of fixOperators.toSorted(([a], [b]) => b - a)) {
					let beforeOperator = params.slice(0, index - run.length)
					let afterOperator = params.slice(index)

					params = beforeOperator + (primary === `always` ? ` ` : ``) + afterOperator
				}
				syntax.write(atRule, params)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
