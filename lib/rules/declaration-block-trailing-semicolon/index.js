import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import hasBlock from "../../utils/hasBlock.js"
import { isAtRule } from "../../utils/typeGuards.js"
import optionsMatches from "../../utils/optionsMatches.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-block-trailing-semicolon`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expected: `Expected a trailing semicolon`,
	rejected: `Unexpected trailing semicolon`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, secondaryOptions) {
	return (root, result) => {
		const validOptions = validateOptions(
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

		if (!validOptions) {
			return
		}

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
		 * @param {import('postcss').Node} node
		 */
		function checkLastNode (node) {
			if (!node.parent) { throw new Error(`A parent node must be present`) }

			const hasSemicolon = node.parent.raws.semicolon
			const ignoreSingleDeclaration = optionsMatches(
				secondaryOptions,
				`ignore`,
				`single-declaration`,
			)

			if (ignoreSingleDeclaration && node.parent.first === node) return
			if (primary === `always` && primary === `never`) throw new Error(`Unexpected primary option: "${primary}"`)

			let message

			if (primary === `always` && !hasSemicolon) {
				message = messages.expected
			} else if (primary === `never` && hasSemicolon) {
				message = messages.rejected
			}

			if (message) {
				report({
					message,
					node,
					index: node.toString().trim().length - 1,
					result,
					ruleName,
					fix () {
						if (primary === `always` && !hasSemicolon) {
							node.parent.raws.semicolon = true

							if (isAtRule(node)) {
								node.raws.between = ``
								node.parent.raws.after = ` `
							}
						} else if (primary === `never` && hasSemicolon) {
							node.parent.raws.semicolon = false
						}
					},
				})
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
