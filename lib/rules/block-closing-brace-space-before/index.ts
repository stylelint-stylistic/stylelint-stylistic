import type { AtRule, ChildNode, Rule } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { EVERY_WHITESPACE, LEADING_LINE_BREAK, SEMICOLON_RUN, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { isOnlyWhitespace } from "../../utils/isOnlyWhitespace/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../../utils/lastNodeHoldsTheBlockAfter/index.ts"
import { escapeHeadLength, maskEscapes } from "../../utils/maskEscapes/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { statementString } from "../../utils/statementString/index.ts"
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { sharesRunWithBrace, writesSharedRun } from "../../utils/writesSharedRun/index.ts"
import { writesTwinRun } from "../../utils/writesTwinRun/index.ts"

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
 * Asks whether this rule is the one to write the run in front of the closing brace.
 *
 * Its break twin reads and writes that run too ([#704](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/704)), and behind a wordless declaration the colon rules read it as the run behind the colon ([#416](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/416)). `writesSharedRun` settles the twins as well wherever it holds this rule, so the twin gate is asked outside it alone.
 * @param syntax - The syntax the rule is built over.
 * @param statement - The rule or at-rule whose block is checked.
 * @param result - The Stylelint result, which holds the configuration.
 * @param ruleName - This rule's configured name.
 * @param read - What the check read of the run.
 * @param read.last - The block's last node.
 * @param read.run - The raw in front of the brace behind the escaped head.
 * @param read.escapedHead - The head an escape spells, which every write keeps.
 * @param read.source - The block, `{` to `}`, whose lines both twins count.
 * @param read.index - Where the brace stands in the statement.
 * @returns True where this rule writes it.
 */
function writesTheRunInFrontOfTheBrace (syntax: Syntax, statement: Rule | AtRule, result: PostcssResult, ruleName: string, read: { last: ChildNode, run: string, escapedHead: string, source: string, index: number }): boolean {
	let { last, run, escapedHead, source, index } = read
	// The options speak of the run with a stray semicolon cut out, as the twin reads it
	let after = run.replace(SEMICOLON_RUN, ``)

	if (isDeclaration(last)) {
		if (!writesSharedRun(syntax, last, result, ruleName)) return false

		if (sharesRunWithBrace(syntax, last, result, ruleName)) return true
	}

	// The twins spell one run between them, which a raw holding anything but whitespace is not: a stray semicolon stands in front of the space rule's write and behind the break rule's break, so the two write different parts of the raw (#687)
	if (!isOnlyWhitespace(run)) return true

	return writesTwinRun(shortName, ruleName, statement, result, {
		side: `before`,
		run: after,
		lineText: source,
		runs: () => [after],
		// The twin reads the run as its own where a break opens it, the indentation behind the break being `indentation`'s
		breakPattern: LEADING_LINE_BREAK,
		line: statement.rangeBy({ index }).start.line,
		// The twin's `never-multi-line` empties the raw, and writes nothing where the brace would then land in a `//` comment the last node left open; its `always` options put a break in front of the brace, which closes such a comment
		twinWrites: (twinOption) => twinOption.startsWith(`always`) || !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : `${escapedHead}${run.replaceAll(EVERY_WHITESPACE, ``)}`),
	})
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

			// The rules that read this run with it settle who writes: the twin, and the colon rules behind a wordless declaration
			if (isFixable) isFixable = writesTheRunInFrontOfTheBrace(syntax, statement, result, ruleName, { last, run, escapedHead, source, index })

			let written = run.replace(TRAILING_WHITESPACE, primary.startsWith(`always`) ? ` ` : ``)

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
