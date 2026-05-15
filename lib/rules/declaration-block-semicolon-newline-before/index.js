import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { blockString } from "../../utils/blockString/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isCustomProperty } from "../../utils/isCustomProperty/index.js"
import { isAtRule, isRule } from "../../utils/typeGuards/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-block-semicolon-newline-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedBefore: () => `Expected newline before ";"`,
	expectedBeforeMultiLine: () => `Expected newline before ";" in a multi-line declaration block`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before ";" in a multi-line declaration block`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace before the semicolons of declaration blocks.
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions, context) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let parentRule = decl.parent

			if (!parentRule) throw new Error(`A parent node must be present`)

			if (!isAtRule(parentRule) && !isRule(parentRule)) return

			// Ignore last declaration if there's no trailing semicolon
			if (!parentRule.raws.semicolon && parentRule.last === decl) return

			let value = getDeclarationValue(decl)
			let isCustomPropertyWithOnlyHorizontalSpaces = isCustomProperty(decl.prop) && (/^[ \t]+$/).test(value)

			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50
			if (primary.startsWith(`never`) && value === ` `) return

			const declString = decl.toString()
			const problemIndex = decl.toString().length - 1

			checker.beforeAllowingIndentation({
				source: declString,
				index: declString.length,
				lineCheckStr: blockString(parentRule),
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix: () => {
							if (primary.startsWith(`always`)) {
								if (decl.raws.important) {
									decl.raws.important = decl.raws.important.replace(/\s*$/, context.newline)
								}
								else {
									value = value.replace(/\s*$/, context.newline)

									if (decl.raws.value) decl.raws.value.raw = value
									else decl.value = value
								}

								return
							}

							if (primary === `never-multi-line`) {
								if (decl.raws.important) {
									decl.raws.important = decl.raws.important.replace(/\s*$/, ``)
								}
								else {
									let newValue = isCustomPropertyWithOnlyHorizontalSpaces
										? ` `
										: value.replace(/\s*$/, ``)

									if (decl.raws.value) decl.raws.value.raw = newValue
									else decl.value = newValue
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
