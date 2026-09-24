import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runBehind } from "../../utils/runBehind/index.ts"
import { selectorAttributeOperatorSpaceChecker } from "../../utils/selectorAttributeOperatorSpaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-attribute-operator-space-after`

const MESSAGES = defineMessages({
	expectedAfter: (operator) => `Expected single space after "${operator}"`,
	rejectedAfter: (operator) => `Unexpected whitespace after "${operator}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the operator, `never` no whitespace. */
export type PrimaryOption = `always` | `never`

/**
 * Requires or forbids a space after an attribute operator.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let checker = whitespaceChecker(`space`, primary, messages)
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`],
		})

		if (!validOptions) return

		selectorAttributeOperatorSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			checkBeforeOperator: false,
			// The run the check read, cut from the selector: the parser holds a tab behind a backslash in `spaces.value.after` although the grammar reads it as a character of the value behind the operator
			fix: (index, runString) => [{ start: index + 1, end: index + 1 + runBehind(runString, index).length, text: primary === `always` ? ` ` : `` }],
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
