import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import nextNonCommentNode from "../../utils/nextNonCommentNode.js"
import rawNodeString from "../../utils/rawNodeString.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isAtRule, isRule } from "../../utils/typeGuards.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-block-semicolon-newline-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ";"`,
	expectedAfterMultiLine: () => `Expected newline after ";" in a multi-line declaration block`,
	rejectedAfterMultiLine: () => `Unexpected newline after ";" in a multi-line declaration block`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, _secondaryOptions, context) {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			// Ignore last declaration if there's no trailing semicolon
			const parentRule = decl.parent

			if (!parentRule) { throw new Error(`A parent node must be present`) }

			if (!isAtRule(parentRule) && !isRule(parentRule)) {
				return
			}

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return
			}

			const nextNode = decl.next()

			if (!nextNode) {
				return
			}

			// Allow end-of-line comment
			const nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) {
				return
			}

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: decl.toString().length + 1,
						result,
						ruleName,
						fix () {
							if (primary.startsWith(`always`)) {
								const index = nodeToCheck.raws.before.search(/\r?\n/)

								nodeToCheck.raws.before = index >= 0 ? nodeToCheck.raws.before.slice(index) : context.newline + nodeToCheck.raws.before

								return
							}

							if (primary === `never-multi-line`) {
								nodeToCheck.raws.before = ``
							}
						},
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
