import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE, WHITESPACE_ONLY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { betweenTailAfterColon } from "../../utils/betweenTailAfterColon/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
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

let shortName = `declaration-block-semicolon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
	expectedBeforeSingleLine: () => `Expected single space before ";" in a single-line declaration block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the semicolon, `never` no whitespace; the `-single-line` forms in a single-line declaration block only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace before the semicolons of declaration blocks.
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
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastNodeWithoutSemicolon(decl)) return

			let value = syntax.read(decl)
			let isCustomPropertyWithOnlySpaces = false

			if (isCustomProperty(decl.prop)) {
				// Stored for future safe replacement
				isCustomPropertyWithOnlySpaces = WHITESPACE_ONLY.test(value)

				// The space may stand at the tail of `raws.between` until the next parse: `declaration-colon-space-after` writes it there, and a check deferred to the run's end (#355) runs before that (#50)
				if (primary.startsWith(`never`) && betweenTailAfterColon(syntax, decl, result) + value === ` `) return
			}

			let declString = declarationString(syntax, decl)
			let problemIndex = declString.length - 1
			// The semicolon goes at the end of the run the fix cuts into; a `//` comment there is closed by that run's break, so either option would take the semicolon into it: the warning stands. A value of nothing but that run is the run behind the colon too, whose writer the rules asked about it settle (#416)
			let isFixable = !syntax.writesIntoInlineComment(decl, result) && writesSharedRun(syntax, decl, result, ruleName)

			checker.before({
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
									writeWhitespaceBeforeSemicolon(syntax, decl, ` `)

									return
								}

								if (primary.startsWith(`never`)) {
									if (decl.raws.important) decl.raws.important = decl.raws.important.replace(TRAILING_CSS_WHITESPACE, ``)
									else {
										let newValue = isCustomPropertyWithOnlySpaces
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
