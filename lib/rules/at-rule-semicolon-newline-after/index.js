import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import hasBlock from "../../utils/hasBlock.js"
import isStandardSyntaxAtRule from "../../utils/isStandardSyntaxAtRule.js"
import nextNonCommentNode from "../../utils/nextNonCommentNode.js"
import rawNodeString from "../../utils/rawNodeString.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `at-rule-semicolon-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary, _secondary, context) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`],
		})

		if (!validOptions) {
			return
		}

		root.walkAtRules((atRule) => {
			let nextNode = atRule.next()

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
			let nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) {
				return
			}

			const problemIndex = atRule.toString().length + 1

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck),
				index: -1,
				err: (msg) => {
					report({
						message: msg,
						node: atRule,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							nodeToCheck.raws.before = context.newline + nodeToCheck.raws.before
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
