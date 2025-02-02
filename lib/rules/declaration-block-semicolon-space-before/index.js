import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace.js"
import blockString from "../../utils/blockString.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import whitespaceChecker from "../../utils/whitespaceChecker.js"
import { isAtRule, isRule } from "../../utils/typeGuards.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected single space before ";"`,
	rejectedBefore: () => `Unexpected whitespace before ";"`,
	expectedBeforeSingleLine: () => `Expected single space before ";" in a single-line declaration block`,
	rejectedBeforeSingleLine: () => `Unexpected whitespace before ";" in a single-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @type {import('stylelint').Rule} */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) {
			return
		}

		root.walkDecls((decl) => {
			// Ignore last declaration if there's no trailing semicolon
			let parentRule = decl.parent

			if (!parentRule) { throw new Error(`A parent node must be present`) }

			if (!isAtRule(parentRule) && !isRule(parentRule)) {
				return
			}

			if (!parentRule.raws.semicolon && parentRule.last === decl) {
				return
			}

			const declString = decl.toString()
			const problemIndex = decl.toString().length - 1

			checker.before({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							let value = getDeclarationValue(decl)

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
