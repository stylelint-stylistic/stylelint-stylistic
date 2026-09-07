import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { EVERY_BACKSLASH_IN_FRONT_OF_A_SLASH, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
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
 * Returns the part of `raws.between` in front of the colon.
 * @param decl - The declaration.
 * @param index - The colon's index in the checked string.
 * @returns That part.
 */
function beforeColonString (decl: Declaration, index: number): string {
	let between = decl.raws.between

	assertString(between)

	return between.slice(0, index - declarationValueIndex(decl))
}

/** `always` a single space before the colon, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace before the colon of declarations.
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

		declarationColonSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// An inline comment ending this part would swallow the colon; a backslash in front of a slash is blanked first, since `\//` opens a comment to the parser but not to the guard
			isFixable: (decl, index) => !syntax.endsWithInlineComment(beforeColonString(decl, index).replace(EVERY_BACKSLASH_IN_FRONT_OF_A_SLASH, ` `), syntax.inlineComments(decl, result)),
			fix: (decl, index) => {
				let beforeColon = beforeColonString(decl, index)

				assertString(decl.raws.between)

				let fromColon = decl.raws.between.slice(beforeColon.length)

				if (primary === `always`) {
					decl.raws.between = beforeColon.replace(TRAILING_CSS_WHITESPACE, ` `) + fromColon

					return true
				}

				if (primary === `never`) {
					decl.raws.between = beforeColon.replace(TRAILING_CSS_WHITESPACE, ``) + fromColon

					return true
				}

				return false
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
