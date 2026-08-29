import stylelint from "stylelint"

import { TRAILING_WHITESPACE, WHITESPACE_ONLY } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { isAtRule, isRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @type {import('stylelint').RuleBase<'always' | 'never' | 'always-single-line' | 'never-single-line'>}
 */
function rule (primary) {
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

			let value = getDeclarationValue(decl)
			let isCustomPropertyWithOnlySpaces = false

			if (isCustomProperty(decl.prop)) {
				// Stored for future safe replacement
				isCustomPropertyWithOnlySpaces = WHITESPACE_ONLY.test(value)

				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
				if (primary.startsWith(`never`) && value === ` `) return
			}

			let declString = declarationString(decl)
			let problemIndex = declString.length - 1
			// The semicolon goes right after the declaration's text, and the whitespace run the fix cuts into ends it. Where an inline comment stands there, the line break that run begins with is what closes the comment, so either option would take the semicolon into the comment's text: neither can be satisfied, so leave the declaration alone and let the warning stand
			let isFixable = !writesIntoInlineComment(decl, result)

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
						fix: isFixable
							? () => {
								if (primary.startsWith(`always`)) {
									// The raw is kept rather than written anew, so that a comment, and any other layout standing in front of the flag, survives the fix
									if (decl.important) decl.raws.important = (decl.raws.important || ` !important`).replace(TRAILING_WHITESPACE, ` `)
									else setDeclarationValue(decl, value.replace(TRAILING_WHITESPACE, ` `))

									return
								}

								if (primary.startsWith(`never`)) {
									if (decl.raws.important) decl.raws.important = decl.raws.important.replace(TRAILING_WHITESPACE, ``)
									else {
										let newValue = isCustomPropertyWithOnlySpaces
											? ` `
											: value.replace(TRAILING_WHITESPACE, ``)

										setDeclarationValue(decl, newValue)
									}
								}
							}
							: undefined,
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
