import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isAtRule, isRule } from "../../utils/typeGuards.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-block-semicolon-newline-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected newline before ";"`,
	expectedBeforeMultiLine: () => `Expected newline before ";" in a multi-line declaration block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before ";" in a multi-line declaration block`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	const checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			const parentRule = decl.parent

			if (!parentRule) { throw new Error(`A parent node must be present`) }

			if (!isAtRule(parentRule) && !isRule(parentRule)) {
				return
			}

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return
			}

			const declString = decl.toString()

			checker.beforeAllowingIndentation({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: decl.toString().length - 1,
						result,
						ruleName,
					})
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
