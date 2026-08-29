import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { SEMICOLON_RUN } from "../../regexps.ts"
import { addEmptyLineAfter } from "../../utils/addEmptyLineAfter/index.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { hasEmptyLine } from "../../utils/hasEmptyLine/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { removeEmptyLinesAfter } from "../../utils/removeEmptyLinesAfter/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-closing-brace-empty-line-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: `Expected empty line before closing brace`,
	rejected: `Unexpected empty line before closing brace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows an empty line before the closing brace of blocks.
 * @param primary - The primary option, one of `always-multi-line` and `never`.
 * @param secondaryOptions - The secondary options: `except`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always-multi-line` | `never`, secondaryOptions: { except?: `after-closing-brace` | `after-closing-brace`[] }): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`always-multi-line`, `never`],
			},
			{
				actual: secondaryOptions,
				possible: {
					except: [`after-closing-brace`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for closing brace empty line violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// Get whitespace after ""}", ignoring extra semicolon
			let before = (getBlockAfter(statement) || ``).replace(SEMICOLON_RUN, ``)

			// Calculate index
			let statementString = nodeString(statement, result)
			let index = statementString.length - 1

			if (statementString[index - 1] === `\r`) index -= 1

			// Set expectation
			let expectEmptyLineBefore = ((): boolean => {
				let childNodeTypes = statement.nodes.map((item) => item.type)

				// Reverse the primary options if `after-closing-brace` is set
				if (optionsMatches(secondaryOptions, `except`, `after-closing-brace`) && !childNodeTypes.includes(`decl`)) return primary === `never`

				return primary === `always-multi-line` && !isSingleLineString(blockString(statement, result))
			})()

			// Check for at least one empty line
			let hasEmptyLineBefore = hasEmptyLine(before)

			// Return if the expectation is met
			if (expectEmptyLineBefore === hasEmptyLineBefore) return

			let message = expectEmptyLineBefore ? messages.expected : messages.rejected

			report({
				message,
				result,
				ruleName,
				node: statement,
				index,
				endIndex: index,
				fix () {
					if (!expectEmptyLineBefore) {
						removeEmptyLinesAfter(statement)

						return
					}

					addEmptyLineAfter(statement, result)
				},
			})
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
