import stylelint from "stylelint"

import { LEADING_WHITESPACE, SPACES_THEN_BLOCK_COMMENT, SPACES_THEN_INLINE_COMMENT } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `value-list-comma-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline or disallows whitespace after the commas of value lists.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		let fixData: Map<import("postcss").Declaration, number[]> | undefined

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.afterOneOnly,
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
			determineIndex: (declString, match) => {
				let nextChars = declString.slice(match.endIndex)

				// An inline comment is closed by a newline and by nothing else, so the newline this rule asks for is already there
				if (SPACES_THEN_INLINE_COMMENT.test(nextChars)) return false

				// If there are spaces and then a comment begins, look for the newline
				return SPACES_THEN_BLOCK_COMMENT.test(nextChars) ? declString.indexOf(`*/`, match.endIndex) + 1 : match.startIndex
			},
		})

		if (fixData) {
			for (let [decl, commaIndices] of fixData.entries()) {
				for (let index of commaIndices.toSorted((a, b) => a - b).toReversed()) {
					let value = getDeclarationValue(decl)
					let valueIndex = index - declarationValueIndex(decl)
					let beforeValue = value.slice(0, valueIndex + 1)
					let afterValue = value.slice(valueIndex + 1)

					if (primary.startsWith(`always`)) afterValue = getLineBreak(root, result) + afterValue
					else if (primary.startsWith(`never-multi-line`)) afterValue = afterValue.replace(LEADING_WHITESPACE, ``)

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
