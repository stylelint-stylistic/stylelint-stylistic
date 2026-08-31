import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { assertString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `declaration-colon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ":"`,
	rejectedBefore: () => `Unexpected whitespace before ":"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Gets everything the declaration's `between` holds in front of the colon.
 * @param decl - The declaration to look at.
 * @param index - The index of the colon within the checked string.
 * @returns The part of `between` in front of the colon.
 */
function beforeColonString (decl: Declaration, index: number): string {
	let between = decl.raws.between

	assertString(between)

	return between.slice(0, index - declarationValueIndex(decl))
}

/**
 * Requires a single space or disallows whitespace before the colon of declarations.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `never`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never`): RuleCheck {
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
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The colon stands right after this part, so an inline comment ending it would swallow the colon
			isFixable: (decl, index) => !syntax.endsWithInlineComment(beforeColonString(decl, index), syntax.inlineComments(decl, result)),
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
