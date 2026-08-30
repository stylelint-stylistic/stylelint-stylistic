import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS, TRAILING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `block-opening-brace-newline-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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

/**
 * Requires a newline or disallows whitespace before the opening brace of blocks.
 * @param primary - The primary option, one of `always`, `always-single-line`, `never-single-line`, `always-multi-line` and `never-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
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

		// Check both kinds of statement: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for opening brace newline before violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has an empty block
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
					// The brace stands right after `between`, so an inline comment ending it would swallow the brace, and `never` demands that the brace joins the comment's line, which nothing can grant
					let isFixable = !(primary.startsWith(`never`) && endsWithInlineComment(between, inlineCommentReading(statement, result)))

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

									if (spaceIndex >= 0) statement.raws.between = statement.raws.between.slice(0, spaceIndex) + getLineBreak(root, result) + statement.raws.between.slice(spaceIndex)
									else statement.raws.between += getLineBreak(root, result)
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
