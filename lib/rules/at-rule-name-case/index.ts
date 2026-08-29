import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `at-rule-name-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Enforces lowercase or uppercase for at-rule names.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		let expectation: `lower` | `upper` = primary

		root.walkAtRules((atRule) => {
			if (!isStandardSyntaxAtRule(atRule)) return

			let name = atRule.name

			let expectedName = expectation === `lower` ? name.toLowerCase() : name.toUpperCase()

			if (name === expectedName) return

			report({
				message: messages.expected,
				messageArgs: [name, expectedName],
				node: atRule,
				ruleName,
				result,
				fix () {
					atRule.name = expectedName
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
