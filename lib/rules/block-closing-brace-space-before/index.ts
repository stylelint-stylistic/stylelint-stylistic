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

/**
 * Requires or disallows whitespace before the closing brace of blocks.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line` and `never-multi-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`): RuleCheck {
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

		// Check both kinds of statement: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for closing brace space before violations.
		 * @param statement - The rule or at-rule to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let source = blockString(statement, result)
			let statementString = nodeString(statement, result)
			let blockAfter = getBlockAfter(statement) || ``

			let index = statementString.length - 2

			if (statementString[index - 1] === `\r`) index -= 1

			// Every option of this rule writes over the whitespace ending the block's final raw, and leaves everything in front of that whitespace exactly where it stands: the rest of the raw, a stray semicolon among it, and the whitespace the last node of the block ends with. So the question goes to the whole run the fix leaves standing rather than to the last node alone — a break anywhere in it closes an inline comment that node left open, and the brace lands outside. Where no break survives there, the brace goes into the comment's text and takes the block's close with it, a file neither Sass nor Less reads back whatever `postcss-less` makes of it, so the statement is left alone and the warning stands
			//
			// Where the last node has swallowed the block's final raw, that raw is the whitespace the node itself ends with, and the write lands on it, so nothing stands between the node and the write — which is what the guard reads when it is told nothing of where the write goes. Spelling the surviving run out there would count that whitespace twice over, the text a write follows already carrying the whole of the node's `raws.between`
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
