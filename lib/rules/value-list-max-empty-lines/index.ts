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
import { runHeldInTheValue } from "../../utils/runHeldForTheBlock/index.ts"
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
			let written = syntax.read(decl)
			// The run a custom property keeps for the closing brace is the block's, not the list's
			let held = runHeldInTheValue(syntax, decl, result)
			let value = written.slice(0, written.length - held.length)

			// Both kinds, since a `/*` written inside a `//` comment opens no comment under a syntax that spells one
			let comments = syntax.commentSpans(value, decl, result)

			// Read in a copy of the same length with every comment blanked, so a run inside a comment is reported by no warning and collapsed by no fix
			let blankedValue = blankComments(value, comments)

			// What stands between the parentheses of a bare address is the address's text, a comment there included, which Less hands on as it is and no compiler reads a call in
			blankedValue = blankComments(blankedValue, bareAddressSpans(blankedValue))

			// What stands between a call's quotation marks is its text, a break in it a character of it: Less hands the string on as it is and lightningcss drops the declaration either way, while a raw break in a quoted string is a parse error to dart-sass, so no run of breaks there is a run of empty lines
			blankedValue = blankComments(blankedValue, findStringSpans(blankedValue, PLAIN_CSS))

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
						syntax.write(decl, collapseBreakRuns(value, blankedValue, maxAdjacentNewlines) + held)
					},
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
