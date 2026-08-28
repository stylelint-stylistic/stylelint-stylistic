import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { CONTAINS_HEX_COLOR, HEX_COLOR } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { applyEditsFromEnd } from "../../utils/applyEditsFromEnd/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { opensAnAddress } from "../../utils/opensAnAddress/index.js"
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

/** @typedef {import('../../utils/applyEditsFromEnd/index.js').Edit} Edit */

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
			let inlineComments = findInlineCommentSpans(declValue, readsInlineComments(decl, result))
			let parsedValue = valueParser(declValue)
			// What a fix changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
			/** @type {Edit[]} */
			let edits = []

			parsedValue.walk((node, at, siblings) => {
				let { value } = node

				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(node, at, siblings)) return false

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
						// A hex colour is a word, and the text a word node stands in is its own value: the span is as long as the value the parser read, which is what the expected spelling replaces
						edits.push({ start: node.sourceIndex, end: node.sourceIndex + value.length, text: expected })
					},
				})
			})

			if (edits.length > 0) setDeclarationValue(decl, applyEditsFromEnd(declValue, edits))
		})
	}
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
