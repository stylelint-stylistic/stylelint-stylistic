import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { hasBlock } from "../../utils/hasBlock/index.js"
import { optionsMatches } from "../../utils/optionsMatches/index.js"
import { isAtRule } from "../../utils/typeGuards/index.js"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-trailing-semicolon`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected a trailing semicolon`,
	rejected: `Unexpected trailing semicolon`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows a trailing semicolon within declaration blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always`, `never`],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`single-declaration`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			if (!atRule.parent) throw new Error(`A parent node must be present`)
			if (atRule.parent === root || atRule !== atRule.parent.last || hasBlock(atRule)) return
			checkLastNode(atRule)
		})

		root.walkDecls((decl) => {
			if (!decl.parent) throw new Error(`A parent node must be present`)
			if (decl.parent.type === `object` || decl !== decl.parent.last) return
			checkLastNode(decl)
		})

		/**
		 * Checks the last node for trailing semicolon violations.
		 * @param {import('postcss').Node} node - The node to check.
		 */
		function checkLastNode (node) {
			if (!node.parent) throw new Error(`A parent node must be present`)

			let hasSemicolon = node.parent.raws.semicolon
			let ignoreSingleDeclaration = optionsMatches(
				secondaryOptions,
				`ignore`,
				`single-declaration`,
			)

			if (ignoreSingleDeclaration && node.parent.first === node) return
			if (primary === `always` && primary === `never`) throw new Error(`Unexpected primary option: "${primary}"`)

			let message

			if (primary === `always` && !hasSemicolon) message = messages.expected
			else if (primary === `never` && hasSemicolon) message = messages.rejected

			let problemIndex = node.toString().trim().length - 1

			if (message) {
				let isBodilessAtRule = isAtRule(node)
				// The whitespace before the closing brace is parsed into the at-rule, not into the block
				let between = isBodilessAtRule ? node.raws.between ?? `` : ``
				let beforeWhitespace = between.replace(TRAILING_WHITESPACE, ``)
				// The semicolon goes right behind the node, and an inline comment ending it would swallow the semicolon along with the code it was to close. Whichever of the node's texts ends that way is the guard's to know, so the node is handed over whole. Only `always` writes a semicolon; `never` takes one away and has nowhere to write
				let isFixable = !(primary === `always` && writesIntoInlineComment(node, result))

				report({
					message,
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix: isFixable
						? () => {
							if (primary === `always` && !hasSemicolon) {
								node.parent.raws.semicolon = true

								if (isBodilessAtRule) {
									// Hand the trailing whitespace over to the block, so that the comment and the layout survive
									node.raws.between = beforeWhitespace
									node.parent.raws.after = between.slice(beforeWhitespace.length)
								}
							}
							else if (primary === `never` && hasSemicolon) node.parent.raws.semicolon = false
						}
						: undefined,
				})
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
