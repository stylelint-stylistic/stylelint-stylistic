import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE, WHITESPACE_ONLY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.ts"
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

/**
 * Requires a single space or disallows whitespace before the semicolons of declaration blocks.
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

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastDeclarationWithoutSemicolon(decl)) return

			let value = syntax.read(decl)
			let isCustomPropertyWithOnlySpaces = false

			if (isCustomProperty(decl.prop)) {
				// Stored for future safe replacement
				isCustomPropertyWithOnlySpaces = WHITESPACE_ONLY.test(value)

				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
				if (primary.startsWith(`never`) && value === ` `) return
			}

			let declString = declarationString(syntax, decl)
			let problemIndex = declString.length - 1
			// The semicolon goes right after the declaration's text, and the whitespace run the fix cuts into ends it. Where an inline comment stands there, the line break that run begins with is what closes the comment, so either option would take the semicolon into the comment's text: neither can be satisfied, so leave the declaration alone and let the warning stand. Where the value is nothing but that run, it is the run behind the colon as well, and the rules asked about it settle between them which of them write it (#416)
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
