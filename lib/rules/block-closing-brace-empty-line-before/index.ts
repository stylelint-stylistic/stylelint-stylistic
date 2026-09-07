import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { SEMICOLON_RUN } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { addEmptyLineAfter } from "../../utils/addEmptyLineAfter/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
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

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-closing-brace-empty-line-before`

const MESSAGES = defineMessages({
	expected: `Expected empty line before closing brace`,
	rejected: `Unexpected empty line before closing brace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows an empty line before the closing brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always-multi-line` or `never`.
 * @param secondaryOptions - `except`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always-multi-line` | `never`, secondaryOptions: { except?: `after-closing-brace` | `after-closing-brace`[] }): RuleCheck {
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

		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks one statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// Minus a stray semicolon
			let before = (getBlockAfter(statement) || ``).replace(SEMICOLON_RUN, ``)

			let statementString = nodeString(statement, result)
			let index = statementString.length - 1

			if (statementString[index - 1] === `\r`) index -= 1

			let expectEmptyLineBefore = ((): boolean => {
				let childNodeTypes = statement.nodes.map((item) => item.type)

				// `after-closing-brace` reverses the option for a block with no declaration
				if (optionsMatches(secondaryOptions, `except`, `after-closing-brace`) && !childNodeTypes.includes(`decl`)) return primary === `never`

				return primary === `always-multi-line` && !isSingleLineString(blockString(statement, result))
			})()

			let hasEmptyLineBefore = hasEmptyLine(before)

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

					addEmptyLineAfter(syntax, statement, result)
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
