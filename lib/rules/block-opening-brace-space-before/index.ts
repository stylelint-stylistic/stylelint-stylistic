import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before "{"`,
	rejectedBefore: () => `Unexpected whitespace before "{"`,
	expectedBeforeSingleLine: () => `Expected single space before "{" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "{" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected single space before "{" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires or disallows whitespace before the opening brace of blocks.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line` and `never-multi-line`.
 * @param secondaryOptions - The secondary options: `ignoreAtRules` and `ignoreSelectors`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`, secondaryOptions: { ignoreAtRules?: string | RegExp | (string | RegExp)[], ignoreSelectors?: string | RegExp | (string | RegExp)[] }): RuleCheck {
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
					ignoreAtRules: [isString, isRegExp],
					ignoreSelectors: [isString, isRegExp],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for opening brace space before violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// Return early if at-rule is to be ignored
			if (statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)) return

			// Return early if selector is to be ignored
			if (statement.type === `rule` && optionsMatches(secondaryOptions, `ignoreSelectors`, statement.selector)) return

			let source = beforeBlockString(statement, result)
			let beforeBraceNoRaw = beforeBlockString(statement, result, {
				noRawBefore: true,
			})

			let index = beforeBraceNoRaw.length - 1

			if (beforeBraceNoRaw[index - 1] === `\r`) index -= 1

			checker.before({
				source,
				index: source.length,
				lineCheckStr: blockString(statement, result),
				err: (m) => {
					let between = statement.raws.between ?? ``
					// Only the whitespace run right before the brace may be replaced, so that comments survive
					let beforeWhitespace = between.replace(TRAILING_WHITESPACE, ``)
					// An inline comment ends only with a line break, so the brace can never join its line, and neither option is satisfiable there: leave the code alone and let the warning stand
					let isFixable = !endsWithInlineComment(between, inlineCommentReading(statement, result))

					report({
						message: m,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						fix: isFixable
							? (): void => {
								if (primary.startsWith(`always`)) {
									statement.raws.between = `${beforeWhitespace} `

									return
								}

								if (primary.startsWith(`never`)) statement.raws.between = beforeWhitespace
							}
							: undefined,
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
