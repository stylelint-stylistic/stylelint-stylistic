import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import { nextNonCommentNode } from "../../utils/nextNonCommentNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

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

/**
 * Requires a newline after the semicolon of at-rules.
 * @param primary - The primary option, which is `always`.
 * @param _secondary - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always`, _secondary: unknown): RuleCheck {
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

			if (!isStandardSyntaxAtRule(atRule)) return

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
							nodeToCheck.raws.before = getLineBreak(root, result) + nodeToCheck.raws.before
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
