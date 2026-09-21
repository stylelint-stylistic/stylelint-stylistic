import type { Rule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-list-comma-space-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected single space before ","`,
	rejectedBefore: () => `Unexpected whitespace before ","`,
	expectedBeforeSingleLine: () => `Expected single space before "," in a single-line list`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space before the commas, `never` no whitespace; the `-single-line` forms in a single-line selector list only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or no whitespace before the commas of selector lists.
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

		let fixData: Map<Rule, [number, string][]> | undefined

		selectorListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The run in front of the comma may hold the break closing an inline comment, which no fix may write over
			isFixable: (selector, index, inlineComments, ruleNode, runString) => {
				let runStart = selector.slice(0, index).trimEnd().length

				if (inlineComments.some((inlineComment) => runStart <= inlineComment.endIndex && inlineComment.endIndex < index)) return false

				let run = runInFront(runString, index)

				// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎,b` would come out as `a\,b`, one identifier, or `a\ ,b`, an escaped space, so the warning stands (1789661965)
				if (!editKeepsEscapedCharacter(selector, { start: index - run.length, end: index, text: primary.includes(`always`) ? ` ` : `` })) return false

				return true
			},
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut (1789657288)
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
					let beforeSelector = selector.slice(0, index - run.length)
					let afterSelector = selector.slice(index)

					selector = beforeSelector + (primary.includes(`always`) ? ` ` : ``) + afterSelector
				}

				copies.write(selector)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
