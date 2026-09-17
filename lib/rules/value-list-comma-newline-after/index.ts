import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { LEADING_CSS_WHITESPACE, SPACES_THEN_BLOCK_COMMENT, SPACES_THEN_INLINE_COMMENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { breakAtRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { rereadsAnAddress } from "../../utils/rereadsAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runBehind, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-comma-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ","`,
	expectedAfterMultiLine: () => `Expected newline after "," in a multi-line list`,
	rejectedAfterMultiLine: () => `Unexpected whitespace after "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline after the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line value list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace after the commas of value lists.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		let fixData: Map<Declaration, number[]> | undefined

		valueListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.afterOneOnly,
			checkedRuleName: ruleName,
			// Declined here, since Stylelint counts a fixer as applied whatever it does: a comma in the property name is out of reach, one opening the value is not.
			isFixable: (declNode, index, declString, indices) => {
				// A write parting the name of a bare address from the comma or joining it to the comma switches how PostCSS reads the parentheses
				let edit = primary.startsWith(`always`) ? { start: index + 1, end: index + 1, text: getLineBreak(root, result) } : { start: index + 1, end: index + 1 + runBehind(declString, index).length, text: `` }

				if (index < declarationValueIndex(declNode) || rereadsAnAddress(declString, edit, syntax.inlineComments(declNode, result))) return false

				// A break written into parentheses PostCSS holds as one token makes them code, and a `[` nothing closes inside, or such a `{` in a custom property's value, is then a group the parser finds open and the file stops parsing: the break is refused there and the warning stands
				if (primary.startsWith(`always`) && breakAtRereadsParentheses(declString, index, isCustomProperty(declNode.prop))) return false

				return writesTwinRun(shortName, ruleName, declNode, result, {
					side: `after`,
					run: runBehind(declString, index),
					lineText: declString,
					runs: () => indices.map((each) => runBehind(declString, each)),
					line: declNode.rangeBy({ index }).start.line,
					// The space twin reads the run right behind the comma, which is this one where no comment moved the check (#704)
					twinWrites: () => declString[index] === `,`,
				})
			},
			fix: (declNode, index) => {
				fixData = fixData || (new Map())

				let commaIndices = fixData.get(declNode) || []

				commaIndices.push(index)
				fixData.set(declNode, commaIndices)
			},
			determineIndex: (declString, match) => {
				let nextChars = declString.slice(match.endIndex)

				// Only a newline closes a `//` comment, so the break is there
				if (SPACES_THEN_INLINE_COMMENT.test(nextChars)) return false

				// Behind a block comment, the break is asked for past it
				return SPACES_THEN_BLOCK_COMMENT.test(nextChars) ? declString.indexOf(`*/`, match.endIndex) + 1 : match.startIndex
			},
		})

		if (fixData) {
			for (let [decl, commaIndices] of fixData.entries()) {
				for (let index of commaIndices.toSorted((a, b) => a - b).toReversed()) {
					let value = syntax.read(decl)
					let valueIndex = index - declarationValueIndex(decl)
					let beforeValue = value.slice(0, valueIndex + 1)
					let afterValue = value.slice(valueIndex + 1)

					if (primary.startsWith(`always`)) afterValue = getLineBreak(root, result) + afterValue
					else if (primary.startsWith(`never-multi-line`)) afterValue = afterValue.replace(LEADING_CSS_WHITESPACE, ``)

					syntax.write(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
