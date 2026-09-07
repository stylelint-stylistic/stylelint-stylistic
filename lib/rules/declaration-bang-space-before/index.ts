import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationBangSpaceChecker } from "../../utils/declarationBangSpaceChecker/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `declaration-bang-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before "!"`,
	rejectedBefore: () => `Unexpected whitespace before "!"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the bang, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace before the bang of declarations.
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

		declarationBangSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// Where an inline comment's closing break opens the run in front of the bang, either option would take the bang into the comment; the warning stands unfixed
			isFixable: (decl, index) => !syntax.endsWithInlineComment(declarationString(syntax, decl).slice(0, index), syntax.inlineComments(decl, result)),
			fix: (target) => {
				// Where the run in front of the bang is empty the write is an insertion
				let start = target.text.slice(0, target.index).replace(TRAILING_CSS_WHITESPACE, ``).length

				if (primary === `always`) return [{ start, end: target.index, text: ` ` }]

				if (primary === `never`) return [{ start, end: target.index, text: `` }]

				return []
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
