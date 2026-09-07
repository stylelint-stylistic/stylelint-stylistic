import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
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

/** `always` a single space before the commas, `never` no whitespace; the `-single-line` forms in a single-line value list only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace before the commas of value lists.
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
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// Refused before the report: a comma in front of the value is the property name's, and one behind a `//` comment is closed by the break either option removes
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
				// Back to front: the comma opening the value moves `declarationValueIndex`, so it is written last
				for (let index of commaIndices.toSorted((a, b) => b - a)) {
					let valueIndex = index - declarationValueIndex(decl)

					// Before a comma opening the value the whitespace is `raws.between`'s
					if (valueIndex === 0) {
						let between = decl.raws.between || `:`

						decl.raws.between = primary.startsWith(`always`) ? between.replace(TRAILING_CSS_WHITESPACE, ` `) : between.replace(TRAILING_CSS_WHITESPACE, ``)

						continue
					}

					let value = syntax.read(decl)
					let beforeValue = value.slice(0, valueIndex)
					let afterValue = value.slice(valueIndex)

					if (primary.startsWith(`always`)) beforeValue = beforeValue.replace(TRAILING_CSS_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) beforeValue = beforeValue.replace(TRAILING_CSS_WHITESPACE, ``)

					syntax.write(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
