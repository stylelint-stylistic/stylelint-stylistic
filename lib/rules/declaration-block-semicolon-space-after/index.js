import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import rawNodeString from "../../utils/rawNodeString.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isAtRule, isRule } from "../../utils/typeGuards.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-block-semicolon-space-after`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ";"`,
	rejectedAfter: () => `Unexpected whitespace after ";"`,
	expectedAfterSingleLine: () => `Expected single space after ";" in a single-line declaration block`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after ";" in a single-line declaration block`,
})

export const meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	const checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		const validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			// Ignore last declaration if there's no trailing semicolon
			const parentRule = decl.parent

			if (!parentRule) { throw new Error(`A parent node must be present`) }

			if (!isAtRule(parentRule) && !isRule(parentRule)) {
				return
			}

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return
			}

			const nextDecl = decl.next()

			if (!nextDecl) {
				return
			}

			checker.after({
				source: rawNodeString(nextDecl),
				index: -1,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: decl.toString().length + 1,
						result,
						ruleName,
						fix () {
							if (primary.startsWith(`always`)) {
								nextDecl.raws.before = ` `

								return
							}

							if (primary.startsWith(`never`)) {
								nextDecl.raws.before = ``
							}
						},
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
