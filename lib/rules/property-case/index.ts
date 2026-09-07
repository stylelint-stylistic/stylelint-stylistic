import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
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
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `lower` or `upper`.
 * @param secondaryOptions - `ignoreSelectors`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`, secondaryOptions: { ignoreSelectors?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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

			if (!syntax.isStandardProperty(prop)) return

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
