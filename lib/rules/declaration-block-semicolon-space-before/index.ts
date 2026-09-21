import stylelint from "stylelint"

import { WHITESPACE_ONLY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { betweenTailAfterColon } from "../../utils/betweenTailAfterColon/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { maskEscapes } from "../../utils/maskEscapes/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { semicolonClosedDeclarations } from "../../utils/semicolonClosedDeclarations/index.ts"
import { isAtRule, isRule } from "../../utils/typeGuards/index.ts"
import { keepsEscapedCharacter, readWhitespaceBeforeSemicolon, writeWhitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { sharesRunWithSemicolon, writesSharedRun } from "../../utils/writesSharedRun/index.ts"
import { writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
	expectedBeforeSingleLine: () => `Expected single space before ";" in a single-line declaration block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the semicolon, `never` no whitespace; the `-single-line` forms in a single-line declaration block only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace before the semicolons of declaration blocks.
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
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule) && !isInlineStyleAttribute(parentRule)) return

			if (isLastNodeWithoutSemicolon(decl)) return

			// The narrowing does not reach into the function below
			let block = parentRule
			let value = syntax.read(decl)
			let isCustomPropertyWithOnlySpaces = false

			if (isCustomProperty(decl.prop)) {
				// Stored for future safe replacement
				isCustomPropertyWithOnlySpaces = WHITESPACE_ONLY.test(value)

				// The space may stand at the tail of `raws.between` until the next parse: `declaration-colon-space-after` writes it there, and a check deferred to the run's end (#355) runs before that (#50)
				if (primary.startsWith(`never`) && betweenTailAfterColon(syntax, decl, result) + value === ` `) return
			}

			let declString = declarationString(syntax, decl)
			let problemIndex = declString.length - 1
			// The semicolon goes at the end of the run the fix cuts into; a `//` comment there is closed by that run's break, so either option would take the semicolon into it: the warning stands. A value of nothing but that run is the run behind the colon too, whose writer the rules asked about it settle (#416). A backslash ending the value would read what the fix puts behind it
			let isFixable = !syntax.writesIntoInlineComment(decl, result) && writesSharedRun(syntax, decl, result, ruleName) && keepsEscapedCharacter(syntax, decl, result, primary.startsWith(`always`) ? ` ` : ``)

			/**
			 * Asks whether this rule writes the run, which the break twin reads and writes too (1789508663). Over a wordless value `writesSharedRun` has settled the two already, and it alone knows that the twin's `never-multi-line` leaves a single space there (#50).
			 * @returns True where it does.
			 */
			function writesTheRun (): boolean {
				if (sharesRunWithSemicolon(syntax, decl, result, ruleName)) return true

				return writesTwinRun(shortName, ruleName, decl, result, {
					side: `before`,
					run: readWhitespaceBeforeSemicolon(syntax, decl, result),
					lineText: blockString(block, result),
					runs: () => semicolonClosedDeclarations(block).map((each) => readWhitespaceBeforeSemicolon(syntax, each, result)),
					line: decl.rangeBy({ index: problemIndex }).start.line,
					// The twin's guards need no mirror: they hold behind a `//` comment or a backslash, where this rule writes nothing either
					twinWrites: () => true,
				})
			}

			checker.before({
				// The run is read over the copy with its escapes masked, where an escaped space is a character of the value and no run (1789661964)
				source: maskEscapes(declString, findEscapeSpans(declString, syntax.inlineComments(decl, result)), true),
				index: declString.length,
				lineCheckStr: blockString(parentRule, result),
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(isFixable && writesTheRun() && {
							fix: (): void => {
								if (primary.startsWith(`always`)) {
									writeWhitespaceBeforeSemicolon(syntax, decl, result, ` `)

									return
								}

								if (primary.startsWith(`never`)) {
									if (isCustomPropertyWithOnlySpaces) syntax.write(decl, ` `)
									else writeWhitespaceBeforeSemicolon(syntax, decl, result, ``)
								}
							},
						}),
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
