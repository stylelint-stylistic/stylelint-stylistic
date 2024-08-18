import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `color-hex-case`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const HEX = /^#[\da-z]+/i
const CONTAINS_HEX = /#[\da-z]+/i
const IGNORED_FUNCTIONS = new Set([`url`])

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

		root.walkDecls((decl) => {
			if (!CONTAINS_HEX.test(decl.value)) { return }

			const parsedValue = valueParser(getDeclarationValue(decl))
			let needsFix = false

			parsedValue.walk((node) => {
				const { value } = node

				if (isIgnoredFunction(node)) { return false }

				if (!isHexColor(node)) { return }

				const expected = primary === `lower` ? value.toLowerCase() : value.toUpperCase()

				if (value === expected) { return }

				report({
					message: messages.expected(value, expected),
					node: decl,
					index: declarationValueIndex(decl) + node.sourceIndex,
					result,
					ruleName,
					fix () {
						node.value = expected
						needsFix = true
					},
				})
			})

			if (needsFix) {
				setDeclarationValue(decl, parsedValue.toString())
			}
		})
	}
}

/**
 * @param {import('postcss-value-parser').Node} node
 */
function isIgnoredFunction ({ type, value }) {
	return type === `function` && IGNORED_FUNCTIONS.has(value.toLowerCase())
}

/**
 * @param {import('postcss-value-parser').Node} node
 */
function isHexColor ({ type, value }) {
	return type === `word` && HEX.test(value)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
