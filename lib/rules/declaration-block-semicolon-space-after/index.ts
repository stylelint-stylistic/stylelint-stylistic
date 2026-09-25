import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blockString } from "../../utils/blockString/index.ts"
import { trailingSemicolonAsked } from "../../utils/closedBySemicolon/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isInlineStyleAttribute } from "../../utils/isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { straySemicolonsTakenBefore, withoutTaken, writtenAsLeftBefore } from "../../utils/straySemicolonsTaken/index.ts"
import { isAtRule, isRule } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ";"`,
	rejectedAfter: () => `Unexpected whitespace after ";"`,
	expectedAfterSingleLine: () => `Expected single space after ";" in a single-line declaration block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the semicolon, `never` no whitespace; the `-single-line` forms in a single-line declaration block only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace after the semicolons of declaration blocks.
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

			// Not read where no semicolon closes the declaration, or where the rule about a trailing semicolon takes it out in the same run, whichever side of this one it is listed: the run behind it is then another node's
			if (isLastNodeWithoutSemicolon(decl) || trailingSemicolonAsked(decl, result) === false) return

			// Under `postcss-less` a semicolon of a `//` comment's text closed the declaration; the one Less closes it on, if any, stands past the comment's break, where the rule does not look
			if (syntax.closingSemicolonIsCommentText(decl, result)) return

			let nextDecl = decl.next()

			if (!nextDecl) return

			let problemIndex = nodeString(decl, result).length + 1

			// The run behind the semicolon is the next node's leading run: the raw where the parser filed one, and otherwise the run PostCSS prints in front of a node a rule of another plugin built without one. A free semicolon of it `no-extra-semicolons` takes out in the same run is read as gone, so that the run is judged as it will stand whichever side of that rule this one is listed
			let taken = straySemicolonsTakenBefore(nextDecl, result)

			checker.after({
				source: withoutTaken(runInFrontOf(nextDecl), taken) + nodeString(nextDecl, result),
				index: -1,
				lineCheckStr: blockString(parentRule, result),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix: (): void => {
							// A free semicolon may stand in this raw with the whitespace around it, and the check reads one it keeps as the character behind the run, so the write spells the leading run alone; one the neighbor takes out stays for it to take, the run written as it leaves it where it still takes it
							nextDecl.raws.before = writtenAsLeftBefore(nextDecl, (run) => {
								let rest = run.slice((run.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length)

								return primary.startsWith(`always`) ? ` ${rest}` : rest
							}, result)
						},
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
