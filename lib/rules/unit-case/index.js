import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getDimension } from "../../utils/getDimension/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule } from "../../utils/typeGuards/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `unit-case`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies lowercase or uppercase for units.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for unit case violations.
		 * @template {import('postcss').AtRule | import('postcss').Declaration} T
		 * @param {T} node - The node to check.
		 * @param {string} checkedValue - The value to check.
		 * @param {(node: T) => number} getIndex - Function to get the index of the node.
		 * @returns {void}
		 */
		function check (node, checkedValue, getIndex) {
			/** @type {Array<{ index: number, endIndex: number, message: string }>} */
			let problems = []

			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = findInlineCommentSpans(checkedValue, endsInlineCommentOnFormFeed(node), readsInlineComments(node, result))

			/**
			 * Processes a value node to check for unit case violations.
			 * @param {import('postcss-value-parser').Node} valueNode - The value parser node to process.
			 * @param {boolean} [reachesNodeEnd] - Whether the text handed over reaches the end position the node reports. The parts of a multiplication below do not: each of them carries the end of the whole word. Every word the value parser builds does, save for one ending in a backslash, whose end that parser counts one character long.
			 * @returns {boolean} True if the node was processed, false otherwise.
			 */
			function processValue (valueNode, reachesNodeEnd = true) {
				let { number, unit: tail } = getDimension(valueNode)

				if (!number || !tail) return false

				let unit = withoutBangFlag(tail)

				if (!unit) return false

				let expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) return false

				let index = getIndex(node)
				// The warning ends where the unit does, so a bang flag riding in the same word stands outside it. The flag is measured in the text the file spells, since that is the text the two positions of the node are counted in: `getDimension` reads its unit out of a copy with the interpolation and the hack units taken out, and a `\9` standing behind the bang would be left inside the warning.
				let flagLength = reachesNodeEnd ? valueNode.value.length - withoutBangFlag(valueNode.value).length : 0

				problems.push({
					index: index + valueNode.sourceIndex + number.length,
					endIndex: index + valueNode.sourceEndIndex - flagLength,
					message: messages.expected,
					messageArgs: [unit, expectedUnit],
				})

				return true
			}

			let parsedValue = valueParser(checkedValue).walk((valueNode) => {
				// Ignore wrong units within `url` function
				let value = valueNode.value

				if (valueNode.type === `function` && value.toLowerCase() === `url`) return false

				// A node standing in the text of an inline comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the break, and what stands there is nothing this rule may read.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				if (value.includes(`*`)) {
					value.split(`*`).some((val) => processValue({
						...valueNode,
						sourceIndex: value.indexOf(val) + val.length + 1,
						value: val,
					}, false))
				}

				if (processValue(valueNode)) {
					let dimension = withoutBangFlag(value)

					valueNode.value = (primary === `lower` ? dimension.toLowerCase() : dimension.toUpperCase()) + value.slice(dimension.length)
				}
			})

			if (problems.length > 0) {
				for (let err of problems) {
					report({
						index: err.index,
						endIndex: err.endIndex,
						message: err.message,
						messageArgs: err.messageArgs,
						node,
						result,
						ruleName,
						fix () {
							if (isAtRule(node)) setAtRuleParams(node, parsedValue.toString())
							else setDeclarationValue(node, parsedValue.toString())
						},
					})
				}
			}
		}

		root.walkAtRules((atRule) => {
			if (!MEDIA_AT_RULE.test(atRule.name) && !(`variable` in atRule)) return

			check(atRule, getAtRuleParams(atRule), atRuleParamIndex)
		})
		root.walkDecls((decl) => check(decl, getDeclarationValue(decl), declarationValueIndex))
	}
}

/**
 * Takes the bang flag off the end of a text, where it carries one.
 *
 * PostCSS moves only the last `!important` of a declaration out of the value, so every flag written in front of it stays where it was, and `postcss-value-parser` reads `1px!important` as one word; Sass writes `!default` and `!global` in the same place. No unit is spelled with a bang, so a unit ends where a flag begins, and the keyword behind it is nothing this rule is about.
 * @param {string} text - A unit read out of a value word, or the word itself.
 * @returns {string} What stands in front of the first bang, or the whole text where it holds none.
 */
function withoutBangFlag (text) {
	let [beforeFlag] = text.split(`!`)

	return beforeFlag
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
