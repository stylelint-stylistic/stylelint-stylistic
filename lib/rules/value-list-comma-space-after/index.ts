import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-comma-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ","`,
	rejectedAfter: () => `Unexpected whitespace after ","`,
	expectedAfterSingleLine: () => `Expected single space after "," in a single-line list`,
	rejectedAfterSingleLine: () => `Unexpected whitespace after "," in a single-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the commas, `never` no whitespace; the `-single-line` forms in a single-line value list only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace after the commas of value lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
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
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			// Declined here, since Stylelint counts a fixer as applied whatever it does: a comma in the property name is out of reach, one opening the value is not.
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
					let value = syntax.read(decl)
					let valueIndex = index - declarationValueIndex(decl)
					let beforeValue = value.slice(0, valueIndex + 1)
					let afterValue = value.slice(valueIndex + 1)

					if (primary.startsWith(`always`)) afterValue = afterValue.replace(LEADING_CSS_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) afterValue = afterValue.replace(LEADING_CSS_WHITESPACE, ``)

					syntax.write(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
