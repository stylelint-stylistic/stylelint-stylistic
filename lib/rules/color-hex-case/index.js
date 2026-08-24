import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { CONTAINS_HEX_COLOR, HEX_COLOR } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"

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

const IGNORED_FUNCTIONS = new Set([`url`])

/**
 * Enforces lowercase or uppercase case for hex color values.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!CONTAINS_HEX_COLOR.test(decl.value)) return

			let declValue = getDeclarationValue(decl)
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = findInlineCommentSpans(declValue, endsInlineCommentOnFormFeed(decl), readsInlineComments(decl, result))
			let parsedValue = valueParser(declValue)
			let needsFix = false

			parsedValue.walk((node) => {
				let { value } = node

				if (isIgnoredFunction(node)) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(node, inlineComments)) return

				if (!isHexColor(node)) return

				let expected = primary === `lower` ? value.toLowerCase() : value.toUpperCase()

				if (value === expected) return

				let problemIndex = declarationValueIndex(decl) + node.sourceIndex

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

			if (needsFix) setDeclarationValue(decl, parsedValue.toString())
		})
	}
}

/**
 * Checks if a node is an ignored function (e.g., url()).
 * @param {import('postcss-value-parser').Node} node - The value parser node to check.
 * @returns {boolean} True if the node is an ignored function, false otherwise.
 */
function isIgnoredFunction ({ type, value }) {
	return type === `function` && IGNORED_FUNCTIONS.has(value.toLowerCase())
}

/**
 * Checks if a node is a hex color value.
 * @param {import('postcss-value-parser').Node} node - The value parser node to check.
 * @returns {boolean} True if the node is a hex color, false otherwise.
 */
function isHexColor ({ type, value }) {
	return type === `word` && HEX_COLOR.test(value)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
