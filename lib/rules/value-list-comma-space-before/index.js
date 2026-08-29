import stylelint from "stylelint"

import { TRAILING_WHITESPACE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { inlineCommentReading } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { ruleMessages, validateOptions } } = stylelint

let shortName = `value-list-comma-space-before`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @type {import('stylelint').RuleBase<'always' | 'never' | 'always-single-line' | 'never-single-line'>}
 */
function rule (primary) {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		/** @type {Map<import('postcss').Declaration, number[]> | undefined} */
		let fixData

		valueListCommaWhitespaceChecker({
			root,
			result,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// Stylelint counts a fixer as applied whatever it does, so a rule that cannot repair a problem has to say so here rather than from inside the fixer. Two of them are such, and the comma has to clear both.
			// A comma standing before the value belongs to the property name, and nothing this rule could write would reach it.
			// A comma standing behind an inline comment cannot be moved either: the comma goes right after the whitespace the fix writes, and the line break that whitespace holds is what closes the comment, so either option would take the comma, and everything the declaration has left, into the comment's text.
			isFixable: (declNode, index, declString) => index >= declarationValueIndex(declNode) && !endsWithInlineComment(declString.slice(0, index), inlineCommentReading(declNode, result)),
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

					let value = getDeclarationValue(decl)
					let beforeValue = value.slice(0, valueIndex)
					let afterValue = value.slice(valueIndex)

					if (primary.startsWith(`always`)) beforeValue = beforeValue.replace(TRAILING_WHITESPACE, ` `)
					else if (primary.startsWith(`never`)) beforeValue = beforeValue.replace(TRAILING_WHITESPACE, ``)

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
