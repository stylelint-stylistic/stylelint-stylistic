import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { declaresTheEncoding } from "../../utils/declaresTheEncoding/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `at-rule-name-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The case, `lower` or `upper`. */
export type PrimaryOption = `lower` | `upper`

/**
 * Enforces lowercase or uppercase for at-rule names.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		let expectation: `lower` | `upper` = primary

		root.walkAtRules((atRule) => {
			if (!syntax.isStandardAtRule(atRule)) return

			// The lower-case name of an encoding declaration is the specification's, not a style (#703)
			if (declaresTheEncoding(atRule)) return

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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
