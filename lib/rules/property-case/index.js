import stylelint from "stylelint"

import isCustomProperty from "../../utils/isCustomProperty.js"
import isStandardSyntaxProperty from "../../utils/isStandardSyntaxProperty.js"
import optionsMatches from "../../utils/optionsMatches.js"
import { isRegExp, isString } from "../../utils/validateTypes.js"
import { isRule } from "../../utils/typeGuards.js"
import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `property-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, secondaryOptions, context) => (root, result) => {
	const validOptions = validateOptions(
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
		const prop = decl.prop

		if (!isStandardSyntaxProperty(prop)) {
			return
		}

		if (isCustomProperty(prop)) {
			return
		}

		const { parent } = decl

		if (!parent) {
			throw new Error(`A parent node must be present`)
		}

		if (isRule(parent)) {
			const { selector } = parent

			if (selector && optionsMatches(secondaryOptions, `ignoreSelectors`, selector)) {
				return
			}
		}

		const expectedProp = primary === `lower` ? prop.toLowerCase() : prop.toUpperCase()

		if (prop === expectedProp) {
			return
		}

		if (context.fix) {
			decl.prop = expectedProp

			return
		}

		report({
			message: messages.expected(prop, expectedProp),
			word: prop,
			node: decl,
			ruleName,
			result,
		})
	})
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
