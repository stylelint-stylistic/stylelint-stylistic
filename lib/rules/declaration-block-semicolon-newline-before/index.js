import stylelint from "stylelint"

import { SPACES_AND_TABS_ONLY, TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { declarationString } from "../../utils/declarationString/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getLineBreak } from "../../utils/getLineBreak/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isCustomProperty } from "../../utils/isCustomProperty/index.js"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.js"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule, isRule } from "../../utils/typeGuards/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-newline-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions) {
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

			if (isLastDeclarationWithoutSemicolon(decl)) return

			let value = getDeclarationValue(decl)
			let isCustomPropertyWithOnlyHorizontalSpaces = isCustomProperty(decl.prop) && SPACES_AND_TABS_ONLY.test(value)

			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			if (primary.startsWith(`never`) && value === ` `) return

			let declString = declarationString(decl)
			let problemIndex = declString.length - 1
			// The semicolon goes right after the declaration's text, and where an inline comment ends that text, the line break the trailing whitespace opens with is what closes the comment: taking it away, as `never-multi-line` does, would take the semicolon into the comment's text. Nothing can be written there, so the declaration is left alone and the warning stands. The `always` options are in no such danger, since the break they write is what closes such a comment anyway
			let isFixable = primary.startsWith(`always`) || !writesIntoInlineComment(decl, result)

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
						fix: isFixable
							? () => {
								if (primary.startsWith(`always`)) {
									// The semicolon stands behind `!important`, so wherever the declaration carries the flag, the raw holding it is the text the break goes into, and PostCSS keeps that raw only where the flag is spelled some other way than ` !important`. The raw is kept rather than written anew, so that a comment, and any other layout standing in front of the flag, survives the fix
									if (decl.important) decl.raws.important = (decl.raws.important || ` !important`).replace(TRAILING_WHITESPACE, getLineBreak(root, result))
									else setDeclarationValue(decl, value.replace(TRAILING_WHITESPACE, getLineBreak(root, result)))

									return
								}

								if (primary === `never-multi-line`) {
									if (decl.raws.important) {
										decl.raws.important = decl.raws.important.replace(TRAILING_WHITESPACE, ``)
									}
									else {
										let newValue = isCustomPropertyWithOnlyHorizontalSpaces
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
