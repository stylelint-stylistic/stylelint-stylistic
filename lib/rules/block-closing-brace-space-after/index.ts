import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-closing-brace-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "}"`,
	rejectedAfter: () => `Unexpected whitespace after "}"`,
	expectedAfterSingleLine: () => `Expected single space after "}" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "}" of a single-line block`,
	expectedAfterMultiLine: () => `Expected single space after "}" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
}

/**
 * Requires or disallows whitespace after the closing brace of blocks.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line` and `never-multi-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [
				`always`,
				`never`,
				`always-single-line`,
				`never-single-line`,
				`always-multi-line`,
				`never-multi-line`,
			],
		})

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for closing brace space after violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: import("postcss").Rule | import("postcss").AtRule): void {
			let nextNode = statement.next()

			if (!nextNode) return

			if (!hasBlock(statement)) return

			let reportIndex = nodeString(statement, result).length
			let source = rawNodeString(nextNode, result)

			// Skip a semicolon at the beginning, if any
			if (source && source.startsWith(`;`)) {
				source = source.slice(1)
				reportIndex += 1
			}

			checker.after({
				source,
				index: -1,
				lineCheckStr: blockString(statement, result),
				err: (msg) => {
					report({
						message: msg,
						node: statement,
						index: reportIndex,
						endIndex: reportIndex,
						result,
						ruleName,
					})
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
