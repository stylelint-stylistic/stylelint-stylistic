import type { ChildNode, Container } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_WHITESPACE, INLINE_COMMENT_BREAK, LEADING_LINE_BREAK, SEMICOLON_RUN } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { blockTextAsClosed, getBlockTailAsClosed, setBlockTailAsClosed } from "../../utils/blockTail/index.ts"
import { carriesABlock } from "../../utils/carriesABlock/index.ts"
import { closingBraceRunWrites } from "../../utils/closingBraceRunWrites/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { type EscapeSpan, findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { escapeHeadLength, hexadecimalTerminatorAtHead } from "../../utils/maskEscapes/index.ts"
import { indexInFrontOfTheBrace } from "../../utils/rawSpans/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { statementString } from "../../utils/statementString/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { writesSharedRun } from "../../utils/writesSharedRun/index.ts"

let { utils: { validateOptions } } = stylelint

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
 * Keeps the head of the raw in front of the written run, less the whitespace closing a hexadecimal escape where the run opens with a break: the break closes the escape as well, and that whitespace would trail its line.
 * @param writtenRun - The run the write leaves behind the head.
 * @param head - The head of the raw.
 * @param ownedByAnEscape - Whether an escape owns the head rather than a comment's text.
 * @param text - The text the raw stands in, as the semicolon rule leaves it.
 * @param escapes - Its escape spans.
 * @param index - Where the raw opens in it.
 * @returns The head to write.
 */
function headKeptInFrontOf (writtenRun: string, head: string, ownedByAnEscape: boolean, text: string, escapes: EscapeSpan[], index: number): string {
	return ownedByAnEscape && LEADING_LINE_BREAK.test(writtenRun) ? head.slice(hexadecimalTerminatorAtHead(text, escapes, index)) : head
}

/**
 * Asks whether the write may go in: a backslash in front of a line break is a delimiter, and what is written behind it is read as its escape, so emptying the run of `c \⏎}` would leave `c \}`, which the parser reads no block's end in.
 * @param text - The statement through its closing brace, which is its last character.
 * @param raw - The run in front of that brace as it stands.
 * @param written - The run the write leaves there.
 * @returns True where it may.
 */
function writesTheRun (text: string, raw: string, written: string): boolean {
	return editKeepsEscapedCharacter(text, { start: text.length - 1 - raw.length, end: text.length - 1, text: written })
}

/**
 * Asks whether this rule is the one to write the run in front of the closing brace, which the colon rules read as the run behind the colon of a wordless declaration.
 * @param syntax - The syntax the rule is built over.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - This rule's configured name.
 * @param last - The block's last node.
 * @returns True where this rule writes it.
 */
function writesTheRunInFrontOfTheBrace (syntax: Syntax, result: PostcssResult, ruleName: string, last: ChildNode): boolean {
	return !isDeclaration(last) || writesSharedRun(syntax, last, result, ruleName)
}

/** `always` a newline before the closing brace; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line block only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the closing brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		let writes = closingBraceRunWrites(() => getLineBreak(root, result))

		// Rules and at-rules alike
		// Every node carrying a block, a Sass nested property written with a value among them
		root.walk((node) => {
			if (carriesABlock(node)) check(node)
		})

		/**
		 * Checks a statement.
		 * @param statement - The node carrying the block.
		 */
		function check (statement: ChildNode & Container): void {
			// Blockless or empty: nothing to check
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let blockAfter = getBlockTailAsClosed(syntax, statement, result) || ``
			// The text is read through the brace, since a free semicolon behind it is printed too
			let text = statementString(statement, result)
			// An escaped space is the last character of the block's final node and no run at all, and so is the whitespace closing a hexadecimal escape but for a break: PostCSS ends the node at the backslash and files the whitespace an escape covering one spells in the raw behind it, and files the space closing a hexadecimal escape in the node and a tab closing one in the raw, and the run the options speak of opens behind that character, which the write keeps
			// Under `postcss-less` the raw may open with more of a `//` comment a semicolon of its text closed the last node in, and the run opens at the break closing it, which the write has to keep
			let commentHead = syntax.commentTextHead(statement, `after`, result)
			// Asked over the text as the semicolon rule leaves it, since the semicolon it writes or takes between the value and the run decides whether the run's first whitespace character closes an escape ending the value
			let closed = blockTextAsClosed(syntax, statement, result, text, blockAfter)
			let escapes = findEscapeSpans(closed.text, syntax.inlineComments(statement, result))
			let escapedHead = commentHead ?? blockAfter.slice(0, escapeHeadLength(closed.text, escapes, closed.index))
			let run = blockAfter.slice(escapedHead.length)

			// Ignore extra semicolon
			let after = run.replace(SEMICOLON_RUN, ``)

			let blockIsMultiLine = !isSingleLineString(blockString(statement, result))
			let index = indexInFrontOfTheBrace(statement, text)

			// `never-multi-line` empties the final raw, so a `//` comment the last node left open is closed only by a break in the node's own trailing whitespace; where none is, the brace would land in the comment, so no fix. An `always` break closes the comment anyway
			//
			// Where the last node has swallowed the final raw, the guard is told nothing of the surviving run, since `raws.between` already carries it
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = primary.startsWith(`always`) || !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : `${escapedHead}${run.replaceAll(EVERY_WHITESPACE, ``)}`)

			// Behind a wordless declaration the colon rules read this run too, and the two settle who writes
			if (isFixable) isFixable = writesTheRunInFrontOfTheBrace(syntax, result, ruleName, last)

			let writtenRun = writes.newline(primary, run)
			let written = `${headKeptInFrontOf(writtenRun, escapedHead, commentHead === null, closed.text, escapes, closed.index)}${writtenRun}`

			if (isFixable && commentHead !== null) isFixable = INLINE_COMMENT_BREAK.test(writtenRun)

			// A backslash the write would leave reading another character
			if (isFixable) isFixable = writesTheRun(text, run, writtenRun)

			// The question is whether a break *starts* the final run (`LEADING_LINE_BREAK`); the whitespace behind it is `indentation`'s.
			if (!LEADING_LINE_BREAK.test(after)) {
				if (primary === `always`) complain(messages.expectedBefore)
				else if (blockIsMultiLine && primary === `always-multi-line`) complain(messages.expectedBeforeMultiLine)
			}

			if (after !== `` && blockIsMultiLine && primary === `never-multi-line`) complain(messages.rejectedBeforeMultiLine)

			/**
			 * Reports a violation.
			 * @param message - The warning text to report.
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
							if (typeof getBlockTailAsClosed(syntax, statement, result) !== `string`) return

							setBlockTailAsClosed(syntax, statement, result, written)
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
