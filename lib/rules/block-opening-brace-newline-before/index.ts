import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-opening-brace-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before "{"`,
	expectedBeforeSingleLine: () => `Expected newline before "{" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "{" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected newline before "{" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the opening brace; the `-single-line` and `-multi-line` forms ask it, or refuse whitespace there, in a block of that shape only. */
export type PrimaryOption = `always` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the opening brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param _secondaryOptions - Unused.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [
				`always`,
				`always-single-line`,
				`never-single-line`,
				`always-multi-line`,
				`never-multi-line`,
			],
		})

		if (!validOptions) return

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// Blockless or empty
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let source = beforeBlockString(statement, result)
			let beforeBraceNoRaw = beforeBlockString(statement, result, {
				noRawBefore: true,
			})

			let index = beforeBraceNoRaw.length - 1

			if (beforeBraceNoRaw[index - 1] === `\r`) index -= 1

			checker.beforeAllowingIndentation({
				lineCheckStr: blockString(statement, result),
				source,
				index: source.length,
				err: (m) => {
					let between = typeof statement.raws.between === `string` ? statement.raws.between : ``
					// `never` would put the brace into a `//` comment ending `between`: no fix
					let isFixable = !(primary.startsWith(`never`) && syntax.endsWithInlineComment(between, syntax.inlineComments(statement, result)))

					report({
						message: m,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								if (typeof statement.raws.between !== `string`) return

								if (primary.startsWith(`always`)) {
									let spaceIndex = statement.raws.between.search(TRAILING_SPACES_AND_TABS)

									if (spaceIndex >= 0) statement.raws.between = statement.raws.between.slice(0, spaceIndex) + getLineBreak(syntax, root, result) + statement.raws.between.slice(spaceIndex)
									else statement.raws.between += getLineBreak(syntax, root, result)
								}
								else if (primary.startsWith(`never`)) statement.raws.between = statement.raws.between.replace(TRAILING_WHITESPACE, ``)
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
