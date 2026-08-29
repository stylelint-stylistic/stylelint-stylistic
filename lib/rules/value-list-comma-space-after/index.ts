import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { LEADING_WHITESPACE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `value-list-comma-space-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a single space or disallows whitespace after the commas of value lists.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
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
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			// Stylelint counts a fixer as applied whatever it does, so a rule that cannot repair a problem has to say so here rather than from inside the fixer.
			// A comma standing before the value is one such: it belongs to the property name, and nothing this rule could write would reach it. A comma opening the value is the value's first character, and the whitespace behind it belongs to the value like any other, so the boundary takes that one in.
			isFixable: (declNode, index) => index >= declarationValueIndex(declNode),
			fix: (declNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(declNode) || []

				commaIndices.push(index)
				fixData.set(declNode, commaIndices)
			},
		})

		if (fixData) {
			for (let [decl, commaIndices] of fixData.entries()) {
				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let value = getDeclarationValue(decl)
					let valueIndex = index - declarationValueIndex(decl)
					let beforeValue = value.slice(0, valueIndex + 1)
					let afterValue = value.slice(valueIndex + 1)

					if (primary.startsWith(`always`)) afterValue = afterValue.replace(LEADING_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) afterValue = afterValue.replace(LEADING_WHITESPACE, ``)

					setDeclarationValue(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
