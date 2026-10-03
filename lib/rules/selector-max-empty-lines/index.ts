import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { bareAddressSpans } from "../../utils/bareAddressSpans/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { collapseBreakRuns, holdsLongerBreakRun } from "../../utils/collapseBreakRuns/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findStringSpans, PLAIN_CSS } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-max-empty-lines`

const MESSAGES = defineMessages({
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The most empty lines allowed in a row inside a selector. */
export type PrimaryOption = number

/**
 * Limits the number of adjacent empty lines within selectors.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let maxAdjacentNewlines = primary + 1

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: isNumber,
		})

		if (!validOptions) return

		root.walkRules((ruleNode) => {
			let copies = syntax.selectorCopies(ruleNode)
			let { selector } = copies

			// Both kinds, since `postcss-less` leaves a `//` comment of a selector in the raw, where a `/*` inside it opens nothing
			let comments = syntax.commentSpans(selector, ruleNode, result)

			// Read in a copy of the same length with every comment blanked, so a run inside a comment is reported by no warning and collapsed by no fix; a `//` comment holds no run, since the break closing it ends it, and that break survives the fix, which leaves the first break of every run
			let blankedSelector = blankComments(selector, comments)

			// What stands between the parentheses of a bare address is the address's text, a comment there included, which Less hands on as it is and no compiler reads a call in
			blankedSelector = blankComments(blankedSelector, bareAddressSpans(blankedSelector))

			// What stands between a call's quotation marks is its text, a break in it a character of it: Less hands the string on as it is and lightningcss drops the declaration either way, while a raw break in a quoted string is a parse error to dart-sass, so no run of breaks there is a run of empty lines
			blankedSelector = blankComments(blankedSelector, findStringSpans(blankedSelector, PLAIN_CSS))

			if (holdsLongerBreakRun(blankedSelector, maxAdjacentNewlines)) {
				report({
					message: messages.expected,
					messageArgs: [primary],
					node: ruleNode,
					index: 0,
					endIndex: copies.toSourceIndex(selector.length),
					result,
					ruleName,
					fix () {
						copies.write(collapseBreakRuns(selector, blankedSelector, maxAdjacentNewlines))
					},
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
