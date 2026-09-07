import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-before`

const MESSAGES = defineMessages({
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
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line` or `never-multi-line`.
 * @param secondaryOptions - `ignoreAtRules` and `ignoreSelectors`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`, secondaryOptions: {
	ignoreAtRules?: string | RegExp | (string | RegExp)[],
	ignoreSelectors?: string | RegExp | (string | RegExp)[],
}): RuleCheck {
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

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks the whitespace in front of a statement's brace.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// Blockless or empty
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// An ignored at-rule
			if (statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)) return

			// An ignored selector
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
					// Comments in `between` survive
					let beforeWhitespace = between.replace(TRAILING_WHITESPACE, ``)
					// Behind an inline comment the brace cannot join its line, so neither option is satisfiable; the warning stands unfixed
					let isFixable = !syntax.endsWithInlineComment(between, syntax.inlineComments(statement, result))

					report({
						message: m,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								if (primary.startsWith(`always`)) {
									statement.raws.between = `${beforeWhitespace} `

									return
								}

								if (primary.startsWith(`never`)) statement.raws.between = beforeWhitespace
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
