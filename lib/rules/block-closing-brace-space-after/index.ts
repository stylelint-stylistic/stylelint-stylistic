import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { rawNodeString } from "../../utils/rawNodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runBehindBrace } from "../../utils/runBehindBrace/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesRunBehindBrace } from "../../utils/writesRunBehindBrace/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-closing-brace-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after "}"`,
	rejectedAfter: () => `Unexpected whitespace after "}"`,
	expectedAfterSingleLine: () => `Expected single space after "}" of a single-line block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "}" of a single-line block`,
	expectedAfterMultiLine: () => `Expected single space after "}" of a multi-line block`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the closing brace, `never` no whitespace; the `-single-line` and `-multi-line` forms in a block of that shape only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/**
 * Requires or disallows whitespace after the closing brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
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

		// Rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			let nextNode = statement.next()

			if (!nextNode) return

			if (!hasBlock(statement)) return

			let reportIndex = nodeString(statement, result).length
			let source = rawNodeString(nextNode, result)

			// Skip a leading semicolon
			if (source && source.startsWith(`;`)) {
				source = source.slice(1)
				reportIndex += 1
			}

			// The run the check reads opens behind that one semicolon, so the fix writes behind it too, leaving it and whatever stands in front of it in the block's `raws.ownSemicolon`
			let { semicolon, holdsASemicolon } = runBehindBrace(nextNode)
			// A write crossing a further semicolon is `no-extra-semicolons`'s question rather than this rule's, and what may be written there is unsettled (#562, #584, #598, #687): the warning stands
			let isFixable = typeof nextNode.raws.before === `string`
				&& !holdsASemicolon
				&& writesRunBehindBrace(syntax, statement, result, ruleName)

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
						...(isFixable && {
							fix: (): void => {
								nextNode.raws.before = semicolon + (primary.startsWith(`always`) ? ` ` : ``)
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
