import styleSearch from "style-search"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE, LEADING_WHITESPACE_WITHOUT_BREAK, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE, WHITESPACE_THEN_BLOCK_COMMENT, WHITESPACE_THEN_INLINE_COMMENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { breakAtRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { listLines } from "../../utils/rawInFrontOfText/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runBehind } from "../../utils/runBehind/index.ts"
import { selectorSearchCopy } from "../../utils/selectorSearchCopy/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesKeepingAddresses } from "../../utils/writesKeepingAddresses/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line selector list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace after the commas of selector lists.
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
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			if (!syntax.isStandardRule(ruleNode)) return

			// The raw selector is read, so an end-of-line comment behind the comma is allowed
			let copies = syntax.selectorCopies(ruleNode)
			let { selector } = copies

			let fixIndices: number[] = []
			let checks: { commaIndex: number, checkIndex: number }[] = []

			styleSearch(
				{
					// The search reads a string by rules of its own, so the commas are found over the copy and checked over the selector
					source: selectorSearchCopy(selector).searchString,
					target: `,`,
					functionArguments: `skip`,
				},
				(match) => {
					let nextChars = selector.slice(match.endIndex)

					// A newline alone closes an inline comment, so the one asked for is there
					if (WHITESPACE_THEN_INLINE_COMMENT.test(nextChars)) return

					// Behind spaces and a block comment, look after the comment
					checks.push({ commaIndex: match.startIndex, checkIndex: WHITESPACE_THEN_BLOCK_COMMENT.test(nextChars) ? selector.indexOf(`*/`, match.endIndex) + 1 : match.startIndex })
				},
			)

			// A comma opening the selector opens the list with an empty item, and the run in front of it is among the list's lines, as for the other rules of the list
			let lineCheckStr = listLines(ruleNode, selector, checks[0]?.commaIndex === 0, result)

			let problems: { message: string, sourceIndex: number, fixIndex: number, edits: Edit[] | undefined }[] = []

			for (let { commaIndex, checkIndex } of checks) {
				checker.afterOneOnly({
					source: selector,
					lineCheckStr,
					index: checkIndex,
					err: (m) => {
						// A `never` fix may take the break closing an inline comment: reported unfixed. The `always` options take nothing
						let fixIndex = checkIndex + 1
						let runEnd = fixIndex + (selector.slice(fixIndex).length - selector.slice(fixIndex).trimStart().length)
						let closesInlineComment = primary.startsWith(`never`) && copies.comments.some((inlineComment) => fixIndex <= inlineComment.endIndex && inlineComment.endIndex < runEnd)
						// A break written into parentheses PostCSS holds as one token other than an address's makes them code, and a `[` nothing closes inside is then a group the parser finds open and the file stops parsing
						let opensAGroup = primary.startsWith(`always`) && breakAtRereadsParentheses(selector, commaIndex, false, syntax.inlineComments(ruleNode, result))
						// The break written behind the comma or the run taken out from there can part the name of a bare address from the comma or join it to the comma, and a break written into parentheses PostCSS holds as one plain token makes them code, so that a later `(` pops another word than `url` or pops `url` where it popped another; the writes of the rule are asked together whether PostCSS then reads the parentheses of an address the other way
						let edit = primary.startsWith(`always`) ? { start: fixIndex, end: fixIndex, text: getLineBreak(root, result) } : { start: fixIndex, end: fixIndex + runBehind(selector, checkIndex).length, text: `` }

						problems.push({ message: m, sourceIndex: copies.toSourceIndex(commaIndex), fixIndex, edits: closesInlineComment || opensAGroup ? undefined : [edit] })
					},
				})
			}

			// Stylelint counts a fixer as applied whatever it does, so which fixes are given is settled before the reports, and together
			let given = writesKeepingAddresses(selector, problems.map(({ edits, sourceIndex }) => ({ edits, index: sourceIndex })), syntax.inlineComments(ruleNode, result), ruleNode, result, ruleName)

			for (let [problemIndex, { message, sourceIndex, fixIndex }] of problems.entries()) {
				report({
					message,
					node: ruleNode,
					index: sourceIndex,
					endIndex: sourceIndex,
					result,
					ruleName,
					...(given[problemIndex] && {
						fix: (): void => {
							fixIndices.push(fixIndex)
						},
					}),
				})
			}

			if (fixIndices.length > 0) {
				let fixedSelector = selector

				for (let index of fixIndices.toSorted((a, b) => b - a)) {
					let beforeSelector = fixedSelector.slice(0, index)
					let afterSelector = fixedSelector.slice(index)

					// Trim to the break already there, adding one only where none stands, so that no line of whitespace alone is left in front of it
					if (primary.startsWith(`always`)) afterSelector = OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(afterSelector) ? afterSelector.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : getLineBreak(root, result) + afterSelector
					else if (primary.startsWith(`never-multi-line`)) afterSelector = afterSelector.replace(LEADING_CSS_WHITESPACE, ``)

					fixedSelector = beforeSelector + afterSelector
				}

				copies.write(fixedSelector)
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
