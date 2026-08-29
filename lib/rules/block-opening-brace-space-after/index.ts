import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after "{"`,
	rejectedAfter: () => `Unexpected whitespace after "{"`,
	expectedAfterSingleLine: () => `Expected single space after "{" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "{" of a single-line block`,
	expectedAfterMultiLine: () => `Expected single space after "{" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows whitespace after the opening brace of blocks.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line` and `never-multi-line`.
 * @param secondaryOptions - The secondary options: `ignore`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignore?: `at-rules` | `at-rules`[] }): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`never`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`at-rules`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)

		if (!optionsMatches(secondaryOptions, `ignore`, `at-rules`)) root.walkAtRules(check)

		/**
		 * Checks a statement for opening brace space after violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let problemIndex = beforeBlockString(statement, result, { noRawBefore: true }).length + 1

			checker.after({
				source: blockString(statement, result),
				index: 0,
				err: (m) => {
					report({
						message: m,
						node: statement,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							let statementFirst = statement.first

							if (statementFirst === undefined) return

							if (primary.startsWith(`always`)) statementFirst.raws.before = ` `
							else if (primary.startsWith(`never`)) statementFirst.raws.before = ``
						},
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
