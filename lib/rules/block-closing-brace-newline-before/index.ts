import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { EVERY_WHITESPACE, LEADING_LINE_BREAK, LINE_BREAK, SEMICOLON_RUN, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-closing-brace-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: `Expected newline before "}"`,
	expectedBeforeMultiLine: `Expected newline before "}" of a multi-line block`,
	rejectedBeforeMultiLine: `Unexpected whitespace before "}" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the closing brace of blocks.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		// Check both kinds of statements: rules and at-rules
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement for closing brace newline violations.
		 * @param statement - The rule or at-rule node to check.
		 */
		function check (statement: Rule | AtRule): void {
			// Return early if blockless or has empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let blockAfter = getBlockAfter(statement) || ``

			// Ignore extra semicolon
			let after = blockAfter.replace(SEMICOLON_RUN, ``)

			let blockIsMultiLine = !isSingleLineString(blockString(statement, result))
			let statementString = nodeString(statement, result)

			let index = statementString.length - 2

			if (statementString[index - 1] === `\r`) index -= 1

			// The `never-multi-line` option takes every whitespace out of the block's final raw, so no break of that raw survives to close an inline comment the last node of the block left open — only one standing in the whitespace that node itself ends with does, which the option never reaches. Where neither holds one, the brace goes into the comment's text and takes the block's close with it, a file neither Sass nor Less reads back whatever `postcss-less` makes of it, so the statement is left alone and the warning stands. The `always` options are in no such danger, since the break they write is what closes such a comment anyway
			//
			// Where the last node has swallowed the block's final raw, that raw is the whitespace the node itself ends with, and the option does reach it, so nothing stands between the node and the write — which is what the guard reads when it is told nothing of where the write goes. Spelling the surviving run out there would count that whitespace twice over, the text a write follows already carrying the whole of the node's `raws.between`
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = primary.startsWith(`always`) || !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : blockAfter.replaceAll(EVERY_WHITESPACE, ``))

			// What is checked is whether a break *starts* the block's final space — the run between the last declaration and the closing brace. The rest of that whitespace is the indentation rule's business, which is why the question is asked with `LEADING_LINE_BREAK` rather than with `OPENS_WITH_LINE_BREAK`: whitespace in front of the break is the very thing this rule reports.
			if (!LEADING_LINE_BREAK.test(after)) {
				if (primary === `always`) complain(messages.expectedBefore)
				else if (blockIsMultiLine && primary === `always-multi-line`) complain(messages.expectedBeforeMultiLine)
			}

			if (after !== `` && blockIsMultiLine && primary === `never-multi-line`) complain(messages.rejectedBeforeMultiLine)

			/**
			 * Reports a closing brace newline violation.
			 * @param message - The error message to report.
			 */
			function complain (message: string): void {
				report({
					message,
					result,
					ruleName,
					node: statement,
					index,
					endIndex: index,
					...(isFixable && {
						fix: (): void => {
							let raw = getBlockAfter(statement)

							if (typeof raw !== `string`) return

							if (primary.startsWith(`always`)) {
								let firstWhitespaceIndex = raw.search(WHITESPACE)
								let newlineBefore = firstWhitespaceIndex >= 0 ? raw.slice(0, firstWhitespaceIndex) : raw
								let newlineAfter = firstWhitespaceIndex >= 0 ? raw.slice(firstWhitespaceIndex) : ``
								let newlineIndex = newlineAfter.search(LINE_BREAK)

								setBlockAfter(statement, newlineIndex >= 0 ? newlineBefore + newlineAfter.slice(newlineIndex) : newlineBefore + getLineBreak(root, result) + newlineAfter)
							}
							else if (primary === `never-multi-line`) setBlockAfter(statement, raw.replaceAll(EVERY_WHITESPACE, ``))
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
