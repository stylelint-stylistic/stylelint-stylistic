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
function rule (primary, _secondaryOptions, context) {
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
			let isCustomPropertyWithOnlyHorizontalSpaces = isCustomProperty(decl.prop) && (/^[ \t]+$/u).test(value)

			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			if (primary.startsWith(`never`) && value === ` `) return

			const declString = decl.toString()
			const problemIndex = decl.toString().length - 1
			// The semicolon goes right after the declaration's text, and where an inline comment ends that
			// text, the line break the trailing whitespace opens with is what closes the comment: taking it
			// away, as `never-multi-line` does, would take the semicolon into the comment's text. Nothing
			// can be written there, so the declaration is left alone and the warning stands. The value and
			// the raw of `!important` are asked together, as the file spells them, rather than the one of
			// the two the fix trims: `postcss-less` reads a flag out of the text of a `//` comment,
			// `red // c !important` giving a value of `red // c` and a raw of ` !important`, and only the
			// two together show the comment running on to the semicolon. The `always` options are in no
			// such danger, since the break they write is what closes such a comment anyway
			let isFixable = primary.startsWith(`always`) || !endsWithInlineComment(value + (decl.raws.important || ``), readsInlineComments(decl, result))

			checker.beforeAllowingIndentation({
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
									// The semicolon stands behind `!important`, so wherever the declaration carries the flag,
									// the raw holding it is the text the break goes into, and PostCSS keeps that raw only
									// where the flag is spelled some other way than ` !important`. The raw is kept rather than
									// written anew, so that a comment, and any other layout standing in front of the flag, survives the fix
									if (decl.important) decl.raws.important = (decl.raws.important || ` !important`).replace(/\s*$/u, context.newline)
									else setDeclarationValue(decl, value.replace(/\s*$/u, context.newline))

									return
								}

								if (primary === `never-multi-line`) {
									if (decl.raws.important) {
										decl.raws.important = decl.raws.important.replace(/\s*$/u, ``)
									}
									else {
										let newValue = isCustomPropertyWithOnlyHorizontalSpaces
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
