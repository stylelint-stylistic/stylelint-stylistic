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
import { isDeclaration } from "../../utils/typeGuards/index.ts"
import { writesSharedRun } from "../../utils/writesSharedRun/index.ts"

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
 * Spells the run in front of the closing brace as the `always` options ask: whatever stands in front of the run's first whitespace, then the run from its first break, or a break in front of the whole run where it holds none.
 * @param raw - The run as it stands.
 * @param lineBreak - The break the file is written with.
 * @returns The run to write.
 */
function spellTheRun (raw: string, lineBreak: string): string {
	let firstWhitespaceIndex = raw.search(WHITESPACE)
	let head = firstWhitespaceIndex >= 0 ? raw.slice(0, firstWhitespaceIndex) : raw
	let tail = firstWhitespaceIndex >= 0 ? raw.slice(firstWhitespaceIndex) : ``
	let breakIndex = tail.search(LINE_BREAK)

	return breakIndex >= 0 ? head + tail.slice(breakIndex) : head + lineBreak + tail
}

/**
 * Asks whether that spelling would leave out anything of the run the rule does not read as whitespace; the whitespace itself is what it is there to trim.
 * @param raw - The run as it stands.
 * @param lineBreak - The break the file is written with.
 * @returns True where the written run does not hold the same non-whitespace characters as the standing one.
 */
function writeDropsMoreThanWhitespace (raw: string, lineBreak: string): boolean {
	return spellTheRun(raw, lineBreak).replaceAll(EVERY_WHITESPACE, ``) !== raw.replaceAll(EVERY_WHITESPACE, ``)
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

			// Ignore extra semicolon
			let after = blockAfter.replace(SEMICOLON_RUN, ``)

			let blockIsMultiLine = !isSingleLineString(blockString(statement, result))
			let statementString = nodeString(statement, result)

			let index = statementString.length - 2

			if (statementString[index - 1] === `\r`) index -= 1

			// `never-multi-line` empties the final raw, so a `//` comment the last node left open is closed only by a break in the node's own trailing whitespace; where none is, the brace would land in the comment, so no fix. An `always` break closes the comment anyway
			//
			// Where the last node has swallowed the final raw, the guard is told nothing of the surviving run, since `raws.between` already carries it
			let { last } = statement

			if (!last) throw new Error(`The block must hold a node`)

			let isFixable = primary.startsWith(`always`) || !syntax.writesIntoInlineComment(last, result, lastNodeHoldsTheBlockAfter(statement) ? undefined : blockAfter.replaceAll(EVERY_WHITESPACE, ``))

			// Behind a wordless declaration the brace alone closes, the run is the colon rules' head run too, and the rules asked settle who writes (#416)
			if (isFixable && isDeclaration(last)) isFixable = writesSharedRun(syntax, last, result, ruleName)

			// The `always` write takes the run from its first break, keeping only what stands in front of the run's first whitespace, so a stray semicolon standing between the two would go with the whitespace, and no option of the rule speaks of such a semicolon (#687)
			if (isFixable && primary.startsWith(`always`) && writeDropsMoreThanWhitespace(blockAfter, getLineBreak(root, result))) isFixable = false

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
							let raw = getBlockAfter(syntax, statement)

							if (typeof raw !== `string`) return

							if (primary.startsWith(`always`)) setBlockAfter(syntax, statement, spellTheRun(raw, getLineBreak(root, result)))
							else if (primary === `never-multi-line`) setBlockAfter(syntax, statement, raw.replaceAll(EVERY_WHITESPACE, ``))
						},
					}),
				})
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
