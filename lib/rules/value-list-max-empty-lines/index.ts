import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

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

		let violatedCRLFNewLinesRegex = new RegExp(`(?:\r\n){${maxAdjacentNewlines + 1},}`, `u`)
		let violatedLFNewLinesRegex = new RegExp(`\n{${maxAdjacentNewlines + 1},}`, `u`)
		let allowedLFNewLinesString = `\n`.repeat(maxAdjacentNewlines)
		let allowedCRLFNewLinesString = `\r\n`.repeat(maxAdjacentNewlines)

		root.walkDecls((decl) => {
			let value = syntax.read(decl)

			if (violatedLFNewLinesRegex.test(value) || violatedCRLFNewLinesRegex.test(value)) {
				report({
					message: messages.expected,
					messageArgs: [primary],
					node: decl,
					index: 0,
					endIndex: 0,
					result,
					ruleName,
					fix () {
						let newValueString = value
							.replaceAll(new RegExp(violatedLFNewLinesRegex, `gmu`), allowedLFNewLinesString)
							.replaceAll(new RegExp(violatedCRLFNewLinesRegex, `gmu`), allowedCRLFNewLinesString)

						syntax.write(decl, newValueString)
					},
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
