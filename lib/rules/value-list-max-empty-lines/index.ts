import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { collapseBreakRuns, holdsLongerBreakRun } from "../../utils/collapseBreakRuns/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-max-empty-lines`

const MESSAGES = defineMessages({
	expected: (max) => `Expected no more than ${max} empty ${max === 1 ? `line` : `lines`}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The most empty lines allowed in a row inside a value list. */
export type PrimaryOption = number

/**
 * Limits the number of adjacent empty lines within value lists.
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

		root.walkDecls((decl) => {
			let value = syntax.read(decl)

			// Both kinds, since a `/*` written inside a `//` comment opens no comment under a syntax that spells one
			let comments = syntax.commentSpans(value, decl, result)

			// Read in a copy of the same length with every comment blanked, so a run inside a comment is reported by no warning and collapsed by no fix (#503)
			let blankedValue = blankComments(value, comments)

			if (holdsLongerBreakRun(blankedValue, maxAdjacentNewlines)) {
				report({
					message: messages.expected,
					messageArgs: [primary],
					node: decl,
					index: 0,
					endIndex: 0,
					result,
					ruleName,
					fix () {
						syntax.write(decl, collapseBreakRuns(value, blankedValue, maxAdjacentNewlines))
					},
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
