import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isCustomProperty } from "../../utils/isCustomProperty/index.js"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.js"
import { isLastDeclarationWithoutSemicolon } from "../../utils/isLastDeclarationWithoutSemicolon/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule, isRule } from "../../utils/typeGuards/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

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
 * @type {import('stylelint').Rule}
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

			const value = getDeclarationValue(decl)
			let isCustomPropertyWithOnlySpaces = false

			if (isCustomProperty(decl.prop)) {
				// Stored for future safe replacement
				isCustomPropertyWithOnlySpaces = (/^\s+$/u).test(value)

				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
				if (primary.startsWith(`never`) && value === ` `) return
			}

			const declString = decl.toString()
			const problemIndex = decl.toString().length - 1
			// The semicolon stands behind `!important`, so wherever the declaration carries the flag, the raw holding it is the text the fix writes
			let writesImportant = primary.startsWith(`always`) ? Boolean(decl.important) : Boolean(decl.raws.important)
			// The semicolon goes right after this text, and the whitespace run the fix cuts into ends it. Where an inline comment stands there, the line break that run begins with is what closes the comment, so either option would take the semicolon into the comment's text: neither can be satisfied, so leave the declaration alone and let the warning stand
			let isFixable = !endsWithInlineComment(writesImportant ? decl.raws.important || ` !important` : value, readsInlineComments(decl, result))

			checker.before({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
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
									if (decl.important) decl.raws.important = (decl.raws.important || ` !important`).replace(/\s*$/u, ` `)
									else setDeclarationValue(decl, value.replace(/\s*$/u, ` `))

									return
								}

								if (primary.startsWith(`never`)) {
									if (decl.raws.important) decl.raws.important = decl.raws.important.replace(/\s*$/u, ``)
									else {
										const newValue = isCustomPropertyWithOnlySpaces
											? ` `
											: value.replace(/\s*$/u, ``)

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
