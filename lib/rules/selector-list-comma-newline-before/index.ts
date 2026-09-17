import type { Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runInFront, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line selector list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the commas of selector lists.
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

		let fixData: Map<Rule, [number, string][]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			// `never-multi-line` may take away the break closing a `//` comment and put the comma into it; report and leave the code. `always` only adds a break.
			isFixable: (selector, index, inlineComments, ruleNode, sourceIndex, commaIndices, runString) => {
				let runStart = selector.slice(0, index).trimEnd().length
				let closesInlineComment = inlineComments.some((inlineComment) => runStart <= inlineComment.endIndex && inlineComment.endIndex < index)

				if (primary === `never-multi-line` && closesInlineComment) return false

				// The space twin writes the same run, save over a comment's closing break (#704)
				return writesTwinRun(shortName, ruleName, ruleNode, result, {
					side: `before`,
					run: runInFront(runString, index),
					lineText: selector,
					runs: () => commaIndices.map((each) => runInFront(runString, each)),
					line: ruleNode.rangeBy({ index: sourceIndex }).start.line,
					twinWrites: () => !closesInlineComment,
				})
			},
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut and no break parts it from its backslash (1789657288)
			fix: (ruleNode, index, runString) => {
				fixData = fixData || (new Map())

				let commas = fixData.get(ruleNode) || []

				commas.push([index, runInFront(runString, index)])
				fixData.set(ruleNode, commas)

				return true
			},
		})

		if (fixData) {
			for (let [ruleNode, commas] of fixData.entries()) {
				let copies = syntax.selectorCopies(ruleNode)
				let { selector } = copies

				for (let [index, run] of commas.toSorted(([a], [b]) => b - a)) {
					let beforeSelector = selector.slice(0, index)
					let afterSelector = selector.slice(index)

					// The break goes in front of the spaces and tabs ending the run, which become the indentation of the comma's line
					if (primary.startsWith(`always`)) {
						let indentation = run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``

						beforeSelector = beforeSelector.slice(0, beforeSelector.length - indentation.length) + getLineBreak(root, result) + indentation
					}
					else if (primary === `never-multi-line`) beforeSelector = beforeSelector.slice(0, beforeSelector.length - run.length)
					selector = beforeSelector + afterSelector
				}

				copies.write(selector)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
