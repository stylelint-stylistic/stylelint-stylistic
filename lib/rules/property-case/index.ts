import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `property-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for properties.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @param secondaryOptions - The secondary options: `ignoreSelectors`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`, secondaryOptions: { ignoreSelectors?: string | RegExp | (string | RegExp)[] }): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`lower`, `upper`],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreSelectors: [isString, isRegExp],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		root.walkDecls((decl) => {
			let prop = decl.prop

			if (!isStandardSyntaxProperty(prop)) return

			if (isCustomProperty(prop)) return

			let { parent } = decl

			if (!parent) throw new Error(`A parent node must be present`)

			if (isRule(parent)) {
				let { selector } = parent

				if (selector && optionsMatches(secondaryOptions, `ignoreSelectors`, selector)) return
			}

			let expectedProp = primary === `lower` ? prop.toLowerCase() : prop.toUpperCase()

			if (prop === expectedProp) return

			report({
				message: messages.expected,
				messageArgs: [prop, expectedProp],
				word: prop,
				node: decl,
				ruleName,
				result,
				fix () {
					decl.prop = expectedProp
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
