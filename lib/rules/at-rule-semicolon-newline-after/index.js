import stylelint from "stylelint"

import hasBlock from "../../utils/hasBlock.js"
import isStandardSyntaxAtRule from "../../utils/isStandardSyntaxAtRule.js"
import nextNonCommentNode from "../../utils/nextNonCommentNode.js"
import rawNodeString from "../../utils/rawNodeString.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

export const ruleName = `at-rule-semicolon-newline-after`

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ";"`,
})

export const meta = {
	url: `https://github.com/firefoxic/stylelint-codeguide/blob/main/lib/rules/${ruleName}/README.md`,
	fixable: true,
}

/** @type {import('stylelint').Rule} */
const rule = (primary, _secondary, context) => {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`],
		})

		if (!validOptions) {
			return
		}

		root.walkAtRules((atRule) => {
			const nextNode = atRule.next()

			if (!nextNode) {
				return
			}

			if (hasBlock(atRule)) {
				return
			}

			if (!isStandardSyntaxAtRule(atRule)) {
				return
			}

			// Allow an end-of-line comment
			const nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) {
				return
			}

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				err: (msg) => {
					if (context.fix) {
						nodeToCheck.raws.before = context.newline + nodeToCheck.raws.before
					} else {
						report({
							message: msg,
							node: atRule,
							index: atRule.toString().length + 1,
							result,
							ruleName,
						})
					}
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta
export default rule
