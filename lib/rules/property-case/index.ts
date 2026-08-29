import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `property-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for properties.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @param secondaryOptions - The secondary options: `ignoreSelectors`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `lower` | `upper`, secondaryOptions: { ignoreSelectors?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
