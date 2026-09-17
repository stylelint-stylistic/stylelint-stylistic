import type { Declaration } from "postcss"
import stylelint from "stylelint"

import { TRAILING_CSS_WHITESPACE, TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { breakAtRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { valueListCommaWhitespaceChecker } from "../../utils/valueListCommaWhitespaceChecker/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { runInFront, writesTwinRun } from "../../utils/writesTwinRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `value-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line value list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Puts a break in front of the spaces and tabs ending a text, which become the indentation of the comma's line.
 * @param text - The text ending in the run in front of a comma.
 * @param run - That run, read over the copy with its escapes masked.
 * @param lineBreak - The break to write.
 * @returns The text with the break in it.
 */
function breakInFront (text: string, run: string, lineBreak: string): string {
	let indentation = run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``

	return text.slice(0, text.length - indentation.length) + lineBreak + indentation
}

/**
 * Requires a newline or disallows whitespace before the commas of value lists.
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

		let fixData: Map<Declaration, [number, string][]> | undefined

		valueListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			// Refused before the report: a comma in front of the value is the property name's, and under `never-multi-line` a comma behind a `//` comment keeps the break closing it, while `always` only adds one
			isFixable: (declNode, index, declString, indices, runString) => {
				if (index < declarationValueIndex(declNode)) return false

				let closesInlineComment = syntax.endsWithInlineComment(declString.slice(0, index), syntax.inlineComments(declNode, result))

				if (primary === `never-multi-line` && closesInlineComment) return false

				// A break written into parentheses PostCSS holds as one token makes them code, and a `[` nothing closes inside, or such a `{` in a custom property's value, is then a group the parser finds open and the file stops parsing: the break is refused there and the warning stands
				if (primary.startsWith(`always`) && breakAtRereadsParentheses(declString, index, isCustomProperty(declNode.prop))) return false

				let run = runInFront(runString, index)

				// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎,b` would come out as `a\,b`, one identifier, so the warning stands; `always` leaves the break the backslash stands in front of (1789661965)
				if (primary === `never-multi-line` && !editKeepsEscapedCharacter(declString, { start: index - run.length, end: index, text: `` })) return false

				// The space twin writes the same run, save over a comment's closing break (#704)
				return writesTwinRun(shortName, ruleName, declNode, result, {
					side: `before`,
					run,
					lineText: declString,
					runs: () => indices.map((each) => runInFront(runString, each)),
					line: declNode.rangeBy({ index }).start.line,
					twinWrites: () => !closesInlineComment,
				})
			},
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut and no break parts it from its backslash (1789657288)
			fix: (declNode, index, runString) => {
				fixData = fixData || (new Map())

				let commas = fixData.get(declNode) || []

				commas.push([index, runInFront(runString, index)])
				fixData.set(declNode, commas)
			},
		})

		if (fixData) {
			let lineBreak = getLineBreak(root, result)

			for (let [decl, commas] of fixData.entries()) {
				// Back to front: the comma opening the value moves `declarationValueIndex`, so it is written last
				for (let [index, run] of commas.toSorted(([a], [b]) => b - a)) {
					let valueIndex = index - declarationValueIndex(decl)

					// Before a comma opening the value the whitespace is `raws.between`'s
					if (valueIndex === 0) {
						let between = decl.raws.between || `:`

						decl.raws.between = primary.startsWith(`always`) ? breakInFront(between, run, lineBreak) : between.replace(TRAILING_CSS_WHITESPACE, ``)

						continue
					}

					let value = syntax.read(decl)
					let beforeValue = value.slice(0, valueIndex)
					let afterValue = value.slice(valueIndex)

					if (primary.startsWith(`always`)) beforeValue = breakInFront(beforeValue, run, lineBreak)
					else if (primary === `never-multi-line`) beforeValue = beforeValue.slice(0, beforeValue.length - run.length)
					syntax.write(decl, beforeValue + afterValue)
				}
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
