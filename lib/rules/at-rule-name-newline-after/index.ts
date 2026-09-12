import stylelint from "stylelint"

import { LEADING_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { atRuleNameSpaceChecker } from "../../utils/atRuleNameSpaceChecker/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `at-rule-name-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: (name) => `Expected newline after at-rule name "${name}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the at-rule's name, `always-multi-line` in an at-rule with multi-line params only. */
export type PrimaryOption = `always` | `always-multi-line`

/**
 * Requires a newline after at-rule names.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`],
		})

		if (!validOptions) return

		atRuleNameSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			// A neighbour respelling the head makes a `@charset` the encoding declaration within the same run, while the rule asks the text as parsed, which that repair does not change; a break behind the name is never the specification's spelling, so no `@charset` is written into, whatever its head is spelled like (#708)
			isFixable: (atRule) => atRule.name.toLowerCase() !== `charset`,
			fix: (atRule) => {
				let { afterName } = atRule.raws

				if (typeof afterName !== `string`) return

				// The raw holds the comments between the name and the parameters too, so a break inside one is no break behind the name, and cutting the raw at it would open the comment
				let [leading] = afterName.match(LEADING_WHITESPACE) as RegExpMatchArray
				let index = leading.search(LINE_BREAK)

				// Keep the break already standing, whatever runs in front of it; the rest of the raw is the new line's indentation, which `indentation` measures
				atRule.raws.afterName = index >= 0 ? afterName.slice(index) : getLineBreak(syntax, atRule, result) + afterName
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
