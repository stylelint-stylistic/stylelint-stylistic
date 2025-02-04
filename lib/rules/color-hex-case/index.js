import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `color-hex-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const HEX = /^#[\da-z]+/i
const CONTAINS_HEX = /#[\da-z]+/i
const IGNORED_FUNCTIONS = new Set([`url`])

/** @type {import('stylelint').Rule} */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			if (!CONTAINS_HEX.test(decl.value)) { return }

			let parsedValue = valueParser(getDeclarationValue(decl))
			let needsFix = false

			parsedValue.walk((node) => {
				let { value } = node

				if (isIgnoredFunction(node)) { return false }

				if (!isHexColor(node)) { return }

				let expected = primary === `lower` ? value.toLowerCase() : value.toUpperCase()

				if (value === expected) { return }

				const problemIndex = declarationValueIndex(decl) + node.sourceIndex

				report({
					message: messages.expected,
					messageArgs: [value, expected],
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
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
