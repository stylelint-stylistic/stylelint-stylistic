import stylelint from "stylelint"

import { SPACES_AND_TABS_ONLY, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { betweenTailAfterColon } from "../../utils/betweenTailAfterColon/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isAtRule, isRule } from "../../utils/typeGuards/index.ts"
import { writeWhitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesSharedRun } from "../../utils/writesSharedRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ";"`,
	expectedBeforeMultiLine: () => `Expected newline before ";" in a multi-line declaration block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before ";" in a multi-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the semicolons of declaration blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `always-multi-line` or `never-multi-line`.
 * @param _secondaryOptions - None taken.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastNodeWithoutSemicolon(decl)) return

			let value = syntax.read(decl)
			let isCustomPropertyWithOnlyHorizontalSpaces = isCustomProperty(decl.prop) && SPACES_AND_TABS_ONLY.test(value)

			// See #50
			// The single space may still be in `raws.between`, where `declaration-colon-space-after` wrote it before a deferred check (#355)
			if (primary.startsWith(`never`) && betweenTailAfterColon(syntax, decl, result) + value === ` `) return

			let declString = declarationString(syntax, decl)
			let problemIndex = declString.length - 1
			// A `never-multi-line` fix taking the break that closes an inline comment would put the semicolon into it: unfixed. A whitespace-only value is the run behind the colon too, and the rules asked settle who writes it (#416)
			let isFixable = (primary.startsWith(`always`) || !syntax.writesIntoInlineComment(decl, result)) && writesSharedRun(syntax, decl, result, ruleName)

			checker.beforeAllowingIndentation({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule, result),
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								if (primary.startsWith(`always`)) {
									writeWhitespaceBeforeSemicolon(syntax, decl, getLineBreak(syntax, root, result))

									return
								}

								if (primary === `never-multi-line`) {
									if (decl.raws.important) {
										decl.raws.important = decl.raws.important.replace(TRAILING_CSS_WHITESPACE, ``)
									}
									else {
										let newValue = isCustomPropertyWithOnlyHorizontalSpaces
											? ` `
											: value.replace(TRAILING_CSS_WHITESPACE, ``)

										syntax.write(decl, newValue)
									}
								}
							},
						}),
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
