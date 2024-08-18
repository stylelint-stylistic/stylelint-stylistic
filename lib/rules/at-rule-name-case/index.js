import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isStandardSyntaxAtRule from "../../utils/isStandardSyntaxAtRule.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `at-rule-name-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) {
			return
		}

		/** @type {'lower' | 'upper'} */
		const expectation = primary

		root.walkAtRules((atRule) => {
			if (!isStandardSyntaxAtRule(atRule)) {
				return
			}

			const name = atRule.name

			const expectedName = expectation === `lower` ? name.toLowerCase() : name.toUpperCase()

			if (name === expectedName) {
				return
			}

			report({
				message: messages.expected(name, expectedName),
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
