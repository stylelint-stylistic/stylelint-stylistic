import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `at-rule-semicolon-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline after the semicolon of at-rules.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`.
 * @param _secondary - Unused.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always`, _secondary: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`],
		})

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			let nextNode = atRule.next()

			if (!nextNode) return

			if (hasBlock(atRule)) return

			if (!syntax.isStandardAtRule(atRule)) return

			// Allow an end-of-line comment
			let nodeToCheck = nextNonCommentNode(nextNode)

			if (!nodeToCheck) return

			let problemIndex = nodeString(atRule, result).length + 1

			checker.afterOneOnly({
				source: rawNodeString(nodeToCheck, result),
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
							nodeToCheck.raws.before = getLineBreak(syntax, root, result) + nodeToCheck.raws.before
						},
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
