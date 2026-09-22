import type { ChildNode, Container } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { carriesABlock } from "../../utils/carriesABlock/index.ts"
import { closingBraceRunWrites } from "../../utils/closingBraceRunWrites/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { escapeHeadLength, maskEscapes } from "../../utils/maskEscapes/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { statementString } from "../../utils/statementString/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesSharedRun } from "../../utils/writesSharedRun/index.ts"

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
 * Asks whether this rule is the one to write the run in front of the closing brace, which the colon rules read as the run behind the colon of a wordless declaration ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)).
 * @param syntax - The syntax the rule is built over.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - This rule's configured name.
 * @param last - The block's last node.
 * @returns True where this rule writes it.
 */
function writesTheRunInFrontOfTheBrace (syntax: Syntax, result: PostcssResult, ruleName: string, last: ChildNode): boolean {
	return !isDeclaration(last) || writesSharedRun(syntax, last, result, ruleName)
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

		let writes = closingBraceRunWrites(() => getLineBreak(root, result))

		// Every node carrying a block, a Sass nested property written with a value among them (#570)
		root.walk((node) => {
			if (carriesABlock(node)) check(node)
		})

		/**
		 * Checks one statement.
		 * @param statement - The node carrying the block.
		 */
		function check (statement: ChildNode & Container): void {
			// Blockless, or an empty block
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let source = blockString(statement, result)
			let text = statementString(statement, result)
			let blockAfter = getBlockAfter(syntax, statement) || ``

			let index = text.length - 2

			if (text[index - 1] === `\r`) index -= 1

			let escapes = findEscapeSpans(source, syntax.inlineComments(statement, result))
			// An escaped space is the last character of the block's final node and no run at all, so the run is read over the copy with the escapes masked (1789661964); PostCSS ends the node at the backslash and files the whitespace an escape covering one spells in the raw behind it, which the write keeps in front of the run it rewrites
			let escapedHead = blockAfter.slice(0, escapeHeadLength(source, escapes, source.length - 1 - blockAfter.length))
			let run = blockAfter.slice(escapedHead.length)

			// The fix writes over only the whitespace ending the block's final raw, so the guard is asked about the whole surviving run: a break anywhere in it closes a `//` comment the last node left open; where none survives the brace would land in the comment, and the warning stands unfixed. Where the last node has swallowed the final raw the write lands on its own trailing whitespace, which the guard reads when told nothing of the run
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : `${escapedHead}${run.replace(TRAILING_WHITESPACE, ``)}`)

			// Behind a wordless declaration the colon rules read this run too, and the two settle who writes
			if (isFixable) isFixable = writesTheRunInFrontOfTheBrace(syntax, result, ruleName, last)

			let written = writes.space(primary, run)

			// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `c \⏎}` would come out as `c \}`, which the parser reads no block's end in, or `c \ }`, an escaped space (1789664271)
			if (isFixable) isFixable = editKeepsEscapedCharacter(source, { start: source.length - 1 - run.length, end: source.length - 1, text: written })

			checker.before({
				source: maskEscapes(source, escapes, true),
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
								if (typeof getBlockAfter(syntax, statement) !== `string`) return

								setBlockAfter(syntax, statement, `${escapedHead}${written}`)
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
