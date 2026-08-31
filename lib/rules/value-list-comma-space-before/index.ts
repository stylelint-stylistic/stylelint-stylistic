import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-comma-space-before`

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

/**
 * Requires a single space or disallows whitespace before the commas of value lists.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		let fixData: Map<Declaration, number[]> | undefined

		valueListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// Stylelint counts a fixer as applied whatever it does, so a rule that cannot repair a problem has to say so here rather than from inside the fixer. Two of them are such, and the comma has to clear both.
			// A comma standing before the value belongs to the property name, and nothing this rule could write would reach it.
			// A comma standing behind an inline comment cannot be moved either: the comma goes right after the whitespace the fix writes, and the line break that whitespace holds is what closes the comment, so either option would take the comma, and everything the declaration has left, into the comment's text.
			isFixable: (declNode, index, declString) => index >= declarationValueIndex(declNode) && !syntax.endsWithInlineComment(declString.slice(0, index), syntax.inlineComments(declNode, result)),
			fix: (declNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(declNode) || []

				commaIndices.push(index)
				fixData.set(declNode, commaIndices)
			},
		})

		if (fixData) {
			for (let [decl, commaIndices] of fixData.entries()) {
				// The commas are written from the back of the declaration forward, so that a fix never moves the text a later one is counted in. The comma opening the value is the one that moves `declarationValueIndex`, and being the first of them it is written last.
				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let valueIndex = index - declarationValueIndex(decl)

					// The whitespace in front of a comma opening the value is none of the value's: it is the text standing between the colon and the value, which `raws.between` holds, and no write to the value could reach it. It is also the text `declarationValueIndex` counts, so the positions already reported are counted in it as it was.
					if (valueIndex === 0) {
						let between = decl.raws.between || `:`

						decl.raws.between = primary.startsWith(`always`) ? between.replace(TRAILING_WHITESPACE, ` `) : between.replace(TRAILING_WHITESPACE, ``)

						continue
					}

					let value = syntax.read(decl)
					let beforeValue = value.slice(0, valueIndex)
					let afterValue = value.slice(valueIndex)

					if (primary.startsWith(`always`)) beforeValue = beforeValue.replace(TRAILING_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) beforeValue = beforeValue.replace(TRAILING_WHITESPACE, ``)

					syntax.write(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
