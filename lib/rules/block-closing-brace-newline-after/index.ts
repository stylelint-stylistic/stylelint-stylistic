import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { pastEndOfLineComment } from "../../utils/pastEndOfLineComment/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesRunBehindBrace } from "../../utils/writesRunBehindBrace/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-closing-brace-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after "}"`,
	expectedAfterSingleLine: () => `Expected newline after "}" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "}" of a single-line block`,
	expectedAfterMultiLine: () => `Expected newline after "}" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the closing brace; the `-single-line` and `-multi-line` forms ask it, or refuse whitespace there, in a block of that shape only. */
export type PrimaryOption = `always` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** At-rules whose closing brace is passed over, by name or pattern. */
	ignoreAtRules?: string | string[],
}

/**
 * Requires a newline or disallows whitespace after the closing brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreAtRules: [isString],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			if (!hasBlock(statement)) return

			if (statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)) return

			let nextNode = statement.next()

			if (!nextNode) return

			// An end-of-line comment behind the brace is allowed
			let nodeToCheck = pastEndOfLineComment(nextNode)

			if (!nodeToCheck) return

			let reportIndex = nodeString(statement, result).length
			let source = rawNodeString(nodeToCheck, result)

			// Skip a leading semicolon
			if (source && source.startsWith(`;`)) {
				source = source.slice(1)
				reportIndex += 1
			}

			// The space twin writes this raw too, and where the two accept no spelling in common only the one that runs last may write it (#698)
			let isFixable = writesRunBehindBrace(syntax, statement, result, ruleName)

			// One character only; the rest is `indentation`'s
			checker.afterOneOnly({
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
						...(isFixable && {
							fix (): void {
								let nodeToCheckRaws = nodeToCheck.raws

								if (typeof nodeToCheckRaws.before !== `string`) return

								if (primary.startsWith(`always`)) {
									// Keep an existing break, add one where none is
									let index = nodeToCheckRaws.before.search(LINE_BREAK)

									nodeToCheckRaws.before = index >= 0 ? nodeToCheckRaws.before.slice(index) : getLineBreak(syntax, root, result) + nodeToCheckRaws.before
								}
								else if (primary.startsWith(`never`)) nodeToCheckRaws.before = ``
							},
						}),
					})
				},
			})
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
