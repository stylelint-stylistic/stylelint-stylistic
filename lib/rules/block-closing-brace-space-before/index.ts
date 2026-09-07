import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-closing-brace-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before "}"`,
	rejectedBefore: () => `Unexpected whitespace before "}"`,
	expectedBeforeSingleLine: () => `Expected single space before "}" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "}" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected single space before "}" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the closing brace, `never` no whitespace; the `-single-line` and `-multi-line` forms in a block of that shape only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/**
 * Requires or disallows whitespace before the closing brace of blocks.
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

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks one statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// Blockless, or an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let source = blockString(statement, result)
			let statementString = nodeString(statement, result)
			let blockAfter = getBlockAfter(statement) || ``

			let index = statementString.length - 2

			if (statementString[index - 1] === `\r`) index -= 1

			// The fix writes over only the whitespace ending the block's final raw, so the guard is asked about the whole surviving run: a break anywhere in it closes a `//` comment the last node left open; where none survives the brace would land in the comment, and the warning stands unfixed. Where the last node has swallowed the final raw the write lands on its own trailing whitespace, which the guard reads when told nothing of the run
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : blockAfter.replace(TRAILING_WHITESPACE, ``))

			checker.before({
				source,
				index: source.length - 1,
				err: (msg) => {
					report({
						message: msg,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
								let raw = getBlockAfter(statement)

								if (typeof raw !== `string`) return

								if (primary.startsWith(`always`)) setBlockAfter(statement, raw.replace(TRAILING_WHITESPACE, ` `))
								else if (primary.startsWith(`never`)) setBlockAfter(statement, raw.replace(TRAILING_WHITESPACE, ``))
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
