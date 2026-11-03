import stylelint from "stylelint"

import { CHARSET_AT_RULE_NAME, EVERY_LINE_BREAK, LEADING_CSS_WHITESPACE, LEADING_WHITESPACE_WITHOUT_BREAK, LINE_BREAK, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { commentEmptyLineBeforeAsked } from "../../utils/commentEmptyLineBeforeAsked/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { nodeBehindEndOfLineComments } from "../../utils/nodeBehindEndOfLineComments/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFrontOf } from "../../utils/runInFrontOf/index.ts"
import { releasesAKeptSemicolon, straySemicolonsTakenBefore, withoutTaken, writtenAsLeftBefore } from "../../utils/straySemicolonsTaken/index.ts"
import { isComment } from "../../utils/typeGuards/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `at-rule-semicolon-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ";"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always`, a newline after the semicolon. */
export type PrimaryOption = `always`

/**
 * Requires a newline after the semicolon of at-rules.
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
			possible: [`always`],
		})

		if (!validOptions) return

		root.walkAtRules((atRule) => {
			let nextNode = atRule.next()

			if (!nextNode) return

			if (hasBlock(atRule)) return

			// A `@charset` is no at-rule to a reader of its own text, but the semicolon behind it is the file's, and the break behind that is read as behind any node
			if (!syntax.isStandardAtRule(atRule) && !CHARSET_AT_RULE_NAME.test(atRule.name)) return

			// Allow an end-of-line comment; the run in front of any other comment is the run behind the semicolon, judged and written as a node's, whatever follows the comment
			let nodeToCheck = nodeBehindEndOfLineComments(nextNode, result)

			if (!nodeToCheck) return

			let problemIndex = nodeString(atRule, result).length + 1
			// A free semicolon of the checked node's run `no-extra-semicolons` takes out in the same run is read as gone, so that the run is judged as it will stand whichever side of that rule this one is listed
			let taken = straySemicolonsTakenBefore(nodeToCheck, result)

			let standing = runInFrontOf(nodeToCheck)
			let writeEmptyLine = isComment(nodeToCheck) && commentEmptyLineBeforeAsked(nodeToCheck, result)

			/**
			 * Writes the run as the rule leaves it.
			 * @param run - The run.
			 * @returns The written run.
			 */
			function writeRun (run: string): string {
				let base = OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(run) ? run.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : getLineBreak(root, result) + run
				if (writeEmptyLine) {
					let lineBreak = getLineBreak(root, result)
					base = LINE_BREAK.test(base) ? base.replace(LINE_BREAK, (match) => lineBreak + match) : lineBreak.repeat(2) + base
				}
				return base
			}

			/**
			 * Asks whether the write would release a kept semicolon.
			 * @returns True where it would.
			 */
			function checkReleases (): boolean {
				if (!nodeToCheck) return false

				let originalWithoutTaken = withoutTaken(standing, taken)
				let writtenWithoutTaken = writeRun(originalWithoutTaken)
				let originalBreaks = (originalWithoutTaken.match(LEADING_CSS_WHITESPACE)?.[0].match(EVERY_LINE_BREAK) ?? []).length
				let writtenBreaks = (writtenWithoutTaken.match(LEADING_CSS_WHITESPACE)?.[0].match(EVERY_LINE_BREAK) ?? []).length
				let delta = writtenBreaks - originalBreaks

				if (delta === 0) return false

				let edits = [{ offset: nodeToCheck.source?.start?.offset === undefined ? 0 : nodeToCheck.source.start.offset - standing.length, line: (nodeToCheck.source?.start?.line ?? 1) - (standing.match(EVERY_LINE_BREAK) ?? []).length, delta }]

				return releasesAKeptSemicolon(root, result, edits)
			}

			let releases = checkReleases()

			checker.afterOneOnly({
				source: withoutTaken(runInFrontOf(nodeToCheck), taken) + nodeString(nodeToCheck, result),
				index: -1,
				err: (msg) => {
					report({
						message: msg,
						node: atRule,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						...(!releases && {
							fix (): void {
								// Trim to the break already there, adding one only where none stands; a free semicolon the neighbor takes out stays for it to take, the run written as it leaves it
								nodeToCheck.raws.before = writtenAsLeftBefore(nodeToCheck, writeRun, result)
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
