import type { AtRule, Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { beforeBlockString } from "../../utils/beforeBlockString/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { hasEmptyBlock } from "../../utils/hasEmptyBlock/index.ts"
import { escapeHeadLength, maskEscapes } from "../../utils/maskEscapes/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isRegExp, isString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runInFront, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `block-opening-brace-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before "{"`,
	rejectedBefore: () => `Unexpected whitespace before "{"`,
	expectedBeforeSingleLine: () => `Expected single space before "{" of a single-line block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "{" of a single-line block`,
	expectedBeforeMultiLine: () => `Expected single space before "{" of a multi-line block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "{" of a multi-line block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the opening brace, `never` no whitespace; the `-single-line` and `-multi-line` forms in a block of that shape only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line` | `always-multi-line` | `never-multi-line`

/** The secondary options. */
export type SecondaryOptions = {

	/** At-rules whose opening brace is passed over, by name or pattern. */
	ignoreAtRules?: string | RegExp | (string | RegExp)[],

	/** Rules whose selector matches are passed over, by name or pattern. */
	ignoreSelectors?: string | RegExp | (string | RegExp)[],
}

/**
 * Requires or disallows whitespace before the opening brace of blocks.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [
					`always`,
					`never`,
					`always-single-line`,
					`never-single-line`,
					`always-multi-line`,
					`never-multi-line`,
				],
			},
			{
				actual: secondaryOptions,
				possible: {
					ignoreAtRules: [isString, isRegExp],
					ignoreSelectors: [isString, isRegExp],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		// Rules and at-rules alike
		root.walkRules(check)
		root.walkAtRules(check)

		/**
		 * Checks the whitespace in front of a statement's brace.
		 * @param statement - The rule or at-rule.
		 */
		function check (statement: Rule | AtRule): void {
			// Blockless or empty
			if (!hasBlock(statement) || hasEmptyBlock(statement)) return

			// An ignored at-rule
			if (statement.type === `atrule` && optionsMatches(secondaryOptions, `ignoreAtRules`, statement.name)) return

			// An ignored selector
			if (statement.type === `rule` && optionsMatches(secondaryOptions, `ignoreSelectors`, statement.selector)) return

			let source = beforeBlockString(statement, result)
			let beforeBraceNoRaw = beforeBlockString(statement, result, {
				noRawBefore: true,
			})

			let index = beforeBraceNoRaw.length - 1

			if (beforeBraceNoRaw[index - 1] === `\r`) index -= 1

			let between = statement.raws.between ?? ``
			let escapes = findEscapeSpans(source, syntax.inlineComments(statement, result))
			// An escaped space is a character of the head and no run at all, so the run is read over the copy with the escapes masked (1789661964); PostCSS ends the head at the backslash and files the whitespace an escape covering one spells in `raws.between`, which the write keeps in front of the run it rewrites
			let escapedHead = between.slice(0, escapeHeadLength(source, escapes, source.length - between.length))
			let run = between.slice(escapedHead.length)
			let maskedSource = maskEscapes(source, escapes, true)

			checker.before({
				source: maskedSource,
				index: source.length,
				lineCheckStr: blockString(statement, result),
				err: (m) => {
					// Comments in the run survive
					let beforeWhitespace = run.replace(TRAILING_WHITESPACE, ``)
					let written = primary.startsWith(`always`) ? `${beforeWhitespace} ` : beforeWhitespace
					// Behind an inline comment the brace cannot join its line, so neither option is satisfiable; the warning stands unfixed. The parser may keep the comment in the selector or params, so they are asked too
					let isFixable = !syntax.endsWithInlineComment(`${syntax.read(statement)}${between}`, syntax.inlineComments(statement, result))
						// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎{` would come out as `a\{`, which the parser no longer reads as a block, or `a\ {`, an escaped space (1789664271)
						&& editKeepsEscapedCharacter(`${source}{`, { start: source.length - run.length, end: source.length, text: written })
						// The break twin writes the same run, and behind an inline comment neither of them writes at all (#704)
						&& writesTwinRun(shortName, ruleName, statement, result, {
							side: `before`,
							// The run is the check's, read over the copy with its escapes masked, so the space of `a\ {` is no whitespace at all (1789661964)
							run: runInFront(maskedSource, maskedSource.length),
							lineText: blockString(statement, result),
							// The run stands in front of the block whose lines both twins count, so no write of theirs moves it a line
							runs: () => [],
							line: statement.rangeBy({ index }).start.line,
							twinWrites: () => true,
						})

					report({
						message: m,
						node: statement,
						index,
						endIndex: index,
						result,
						ruleName,
						...(isFixable && {
							fix: (): void => {
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
