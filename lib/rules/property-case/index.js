import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import isCustomProperty from "../../utils/isCustomProperty.js"
import { isRule } from "../../utils/typeGuards.js"
import isStandardSyntaxProperty from "../../utils/isStandardSyntaxProperty.js"
import optionsMatches from "../../utils/optionsMatches.js"
import { isRegExp, isString } from "../../utils/validateTypes.js"

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

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
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

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			let prop = decl.prop

			if (!isStandardSyntaxProperty(prop)) {
				return
			}

			if (isCustomProperty(prop)) {
				return
			}

			let { parent } = decl

			if (!parent) {
				throw new Error(`A parent node must be present`)
			}

			if (isRule(parent)) {
				let { selector } = parent

				if (selector && optionsMatches(secondaryOptions, `ignoreSelectors`, selector)) {
					return
				}
			}

			let expectedProp = primary === `lower` ? prop.toLowerCase() : prop.toUpperCase()

			if (prop === expectedProp) {
				return
			}

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
