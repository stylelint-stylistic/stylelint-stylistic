import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS, TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { escapeHeadLength, maskEscapes } from "../../utils/maskEscapes/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

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

/**
 * Puts a break in front of the indentation a run ends on, or behind the whole run where it holds none.
 * @param between - The run in front of the brace.
 * @param lineBreak - The break the file is written with.
 * @returns The run to write.
 */
function breakBeforeTheIndentation (between: string, lineBreak: string): string {
	let spaceIndex = between.search(TRAILING_SPACES_AND_TABS)

	return spaceIndex >= 0 ? between.slice(0, spaceIndex) + lineBreak + between.slice(spaceIndex) : between + lineBreak
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
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
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

			let between = typeof statement.raws.between === `string` ? statement.raws.between : ``
			let escapes = findEscapeSpans(source, syntax.inlineComments(statement, result))
			// An escaped space is a character of the head and no run at all, so the run is read over the copy with the escapes masked (1789661964); PostCSS ends the head at the backslash and files the whitespace an escape covering one spells in `raws.between`, which the write keeps in front of the run it rewrites
			let escapedHead = between.slice(0, escapeHeadLength(source, escapes, source.length - between.length))
			let run = between.slice(escapedHead.length)
			let maskedSource = maskEscapes(source, escapes, true)
			// The parser may keep the comment in the selector or params, so they are asked too
			let headEndsWithInlineComment = syntax.endsWithInlineComment(`${syntax.read(statement)}${between}`, syntax.inlineComments(statement, result))

			checker.beforeAllowingIndentation({
				lineCheckStr: blockString(statement, result),
				source: maskedSource,
				index: source.length,
				err: (m) => {
					let written = primary.startsWith(`always`) ? breakBeforeTheIndentation(run, getLineBreak(root, result)) : run.replace(TRAILING_WHITESPACE, ``)
					// `never` would put the brace into a `//` comment ending the head: no fix
					let isFixable = !(primary.startsWith(`never`) && headEndsWithInlineComment)
						// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: emptying the run of `a\⏎{` would leave `a\{`, which the parser reads no block in (1789664271)
						&& editKeepsEscapedCharacter(`${source}{`, { start: source.length - run.length, end: source.length, text: written })

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

								statement.raws.between = `${escapedHead}${written}`
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
