import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import { assertString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-colon-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets everything the declaration's `between` holds in front of the colon.
 * @param {import('postcss').Declaration} decl - The declaration to look at.
 * @param {number} index - The index of the colon within the checked string.
 * @returns {string} The part of `between` in front of the colon.
 */
function beforeColonString (decl, index) {
	let between = decl.raws.between

	assertString(between)

	return between.slice(0, index - declarationValueIndex(decl))
}

/**
 * Requires a single space or disallows whitespace before the colon of declarations.
 * @type {import('stylelint').RuleBase<'always' | 'never'>}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		declarationColonSpaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The colon stands right after this part, so an inline comment ending it would swallow the colon
			isFixable: (decl, index) => !endsWithInlineComment(beforeColonString(decl, index), inlineCommentReading(decl, result)),
			fix: (decl, index) => {
				let beforeColon = beforeColonString(decl, index)

				assertString(decl.raws.between)

				let fromColon = decl.raws.between.slice(beforeColon.length)

				if (primary === `always`) {
					decl.raws.between = beforeColon.replace(TRAILING_WHITESPACE, ` `) + fromColon

					return true
				}

				if (primary === `never`) {
					decl.raws.between = beforeColon.replace(TRAILING_WHITESPACE, ``) + fromColon

					return true
				}

				return false
			},
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
