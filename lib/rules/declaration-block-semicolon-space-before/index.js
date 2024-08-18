import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isAtRule, isRule } from "../../utils/typeGuards.js"

const { utils: { report, ruleMessages, validateOptions } } = stylelint

const shortName = `declaration-block-semicolon-space-before`

export const ruleName = addNamespace(shortName)

export const messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
	expectedBeforeSingleLine: () => `Expected single space before ";" in a single-line declaration block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before ";" in a single-line declaration block`,
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

			const declString = decl.toString()

			checker.before({
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
						fix () {
							const value = getDeclarationValue(decl)

							if (primary.startsWith(`always`)) {
								if (decl.important) {
									decl.raws.important = ` !important `
								} else {
									setDeclarationValue(decl, value.replace(/\s*$/, ` `))
								}

								return
							}

							if (primary.startsWith(`never`)) {
								if (decl.raws.important) {
									decl.raws.important = decl.raws.important.replace(/\s*$/, ``)
								} else {
									setDeclarationValue(decl, value.replace(/\s*$/, ``))
								}
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
