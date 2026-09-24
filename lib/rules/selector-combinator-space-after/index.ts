import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runBehind } from "../../utils/runBehind/index.ts"
import { selectorCombinatorSpaceChecker } from "../../utils/selectorCombinatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-combinator-space-after`

const MESSAGES = defineMessages({
	expectedAfter: (combinator) => `Expected single space after "${combinator}"`,
	rejectedAfter: (combinator) => `Unexpected whitespace after "${combinator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the combinators, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires a single space or disallows whitespace after the combinators of selectors.
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

		selectorCombinatorSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.after,
			locationType: `after`,
			checkedRuleName: ruleName,
			// The run the check read, cut from the selector: the parser holds a tab behind a backslash in the combinator's spaces although the grammar reads it as a character of the name behind it
			fix: (index, runString) => [{ start: index + 1, end: index + 1 + runBehind(runString, index).length, text: primary === `always` ? ` ` : `` }],
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
