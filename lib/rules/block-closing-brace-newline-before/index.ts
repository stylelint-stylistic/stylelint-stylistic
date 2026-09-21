import type { AtRule, ChildNode, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_WHITESPACE, LEADING_LINE_BREAK, LINE_BREAK, SEMICOLON_RUN, TRAILING_WHITESPACE, WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { escapeHeadLength } from "../../utils/maskEscapes/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { statementString } from "../../utils/statementString/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { sharesRunWithBrace, writesSharedRun } from "../../utils/writesSharedRun/index.ts"
import { writesTwinRun } from "../../utils/writesTwinRun/index.ts"

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
 * Spells the run in front of the closing brace as the `always` options ask: whatever stands in front of the run's first break with the whitespace taken out of it, then the run from that break; where the run holds no break, one in front of its first whitespace, or behind a run holding no whitespace either.
 *
 * A stray semicolon standing in front of the break is no whitespace and stays, since no option of the rule speaks of it ([#687](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/687)), and the check cuts it out of the run it measures, so the break behind it opens that run (1789520440).
 * @param raw - The run as it stands.
 * @param lineBreak - The break the file is written with.
 * @returns The run to write.
 */
function spellTheRun (raw: string, lineBreak: string): string {
	let breakIndex = raw.search(LINE_BREAK)

	if (breakIndex >= 0) return raw.slice(0, breakIndex).replaceAll(EVERY_WHITESPACE, ``) + raw.slice(breakIndex)

	let firstWhitespaceIndex = raw.search(WHITESPACE)

	return firstWhitespaceIndex >= 0 ? raw.slice(0, firstWhitespaceIndex) + lineBreak + raw.slice(firstWhitespaceIndex) : raw + lineBreak
}

/**
 * The run the option writes in front of the closing brace: the `always` spelling, or nothing at all.
 * @param primary - The primary option.
 * @param raw - The run as it stands.
 * @param lineBreak - Returns the break the file is written with, called only where a break is written.
 * @returns The run to write.
 */
function runToWrite (primary: PrimaryOption, raw: string, lineBreak: () => string): string {
	return primary.startsWith(`always`) ? spellTheRun(raw, lineBreak()) : raw.replaceAll(EVERY_WHITESPACE, ``)
}

/**
 * Asks whether the write may go in: a backslash in front of a line break is a delimiter, and what is written behind it is read as its escape, so emptying the run of `c \⏎}` would leave `c \}`, which the parser reads no block's end in (1789664271).
 * @param text - The statement through its closing brace, which is its last character.
 * @param raw - The run in front of that brace as it stands.
 * @param written - The run the write leaves there.
 * @returns True where it may.
 */
function writesTheRun (text: string, raw: string, written: string): boolean {
	return editKeepsEscapedCharacter(text, { start: text.length - 1 - raw.length, end: text.length - 1, text: written })
}

/**
 * Asks whether this rule is the one to write the run in front of the closing brace.
 *
 * Its space twin reads and writes that run too ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)), and behind a wordless declaration the colon rules read it as the run behind the colon ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)). `writesSharedRun` settles the twins as well wherever it holds this rule, so the twin gate is asked outside it alone.
 * @param syntax - The syntax the rule is built over.
 * @param statement - The rule or at-rule whose block is checked.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - This rule's configured name.
 * @param read - What the check read of the run.
 * @param read.last - The block's last node.
 * @param read.run - The raw in front of the brace behind the escaped head.
 * @param read.after - That run with a stray semicolon cut out, which is what the options speak of.
 * @param read.escapedHead - The head an escape spells, which every write keeps.
 * @param read.index - Where the brace stands in the statement.
 * @returns True where this rule writes it.
 */
function writesTheRunInFrontOfTheBrace (syntax: Syntax, statement: Rule | AtRule, result: PostcssResult, ruleName: string, read: { last: ChildNode, run: string, after: string, escapedHead: string, index: number }): boolean {
	let { last, run, after, escapedHead, index } = read

	if (isDeclaration(last)) {
		if (!writesSharedRun(syntax, last, result, ruleName)) return false

		if (sharesRunWithBrace(syntax, last, result, ruleName)) return true
	}

	// The twins spell one run between them, which a raw holding anything but whitespace is not: a stray semicolon stands in front of the space rule's write and behind the break rule's break, so the two write different parts of the raw (#687)
	if (!isOnlyWhitespace(run)) return true

	return writesTwinRun(shortName, ruleName, statement, result, {
		side: `before`,
		run: after,
		lineText: blockString(statement, result),
		runs: () => [after],
		// The run is this rule's where a break opens it, the indentation behind the break being `indentation`'s
		breakPattern: LEADING_LINE_BREAK,
		line: statement.rangeBy({ index }).start.line,
		// The twin writes over the whitespace ending the block's final raw whatever its option, and writes nothing where the brace would land in a `//` comment the last node left open
		twinWrites: () => !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : `${escapedHead}${run.replace(TRAILING_WHITESPACE, ``)}`),
	})
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

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks a statement.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// Blockless or empty: nothing to check
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			let blockAfter = getBlockAfter(syntax, statement) || ``
			// The text is read through the brace, since a free semicolon behind it is printed too (#562)
			let text = statementString(statement, result)
			// An escaped space is the last character of the block's final node and no run at all: PostCSS ends the node at the backslash and files the whitespace an escape covering one spells in the raw behind it, and the run the options speak of opens behind that character, which the write keeps (1789661964)
			let escapedHead = blockAfter.slice(0, escapeHeadLength(text, findEscapeSpans(text, syntax.inlineComments(statement, result)), text.length - 1 - blockAfter.length))
			let run = blockAfter.slice(escapedHead.length)

			// Ignore extra semicolon
			let after = run.replace(SEMICOLON_RUN, ``)

			let blockIsMultiLine = !isSingleLineString(blockString(statement, result))
			let printed = nodeString(statement, result)

			let index = printed.length - 2

			if (printed[index - 1] === `\r`) index -= 1

			// `never-multi-line` empties the final raw, so a `//` comment the last node left open is closed only by a break in the node's own trailing whitespace; where none is, the brace would land in the comment, so no fix. An `always` break closes the comment anyway
			//
			// Where the last node has swallowed the final raw, the guard is told nothing of the surviving run, since `raws.between` already carries it
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = primary.startsWith(`always`) || !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : `${escapedHead}${run.replaceAll(EVERY_WHITESPACE, ``)}`)

			// The rules that read this run with it settle who writes: the twin, and the colon rules behind a wordless declaration
			if (isFixable) isFixable = writesTheRunInFrontOfTheBrace(syntax, statement, result, ruleName, { last, run, after, escapedHead, index })

			let writtenRun = runToWrite(primary, run, () => getLineBreak(root, result))
			let written = `${escapedHead}${writtenRun}`

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
							if (typeof getBlockAfter(syntax, statement) !== `string`) return

							setBlockAfter(syntax, statement, written)
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
