import type { Rule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { breakAtRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { selectorListCommaWhitespaceChecker } from "../../utils/selectorListCommaWhitespaceChecker/index.ts"
import { edgeRunOutOfReach, edgeRunOwned, type EdgeWrite, writeEdgeRun } from "../../utils/textEdge/index.ts"
import { editsAskedWithTheTwins } from "../../utils/twinWritesAtTheComma/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `selector-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line selector list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the commas of selector lists.
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

		let fixData: Map<Rule, [number, string][]> | undefined

		/**
		 * Builds the write in front of a comma: a break in front of the indentation the run there ends with under `always`, else the run taken out, as the check measured it over the copy.
		 * @param runString - The copy the runs are read over.
		 * @param index - The comma's index.
		 * @returns The edit.
		 */
		function editAt (runString: string, index: number): Edit {
			let run = runInFront(runString, index)
			let indentation = run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``

			return primary.startsWith(`always`) ? { start: index - indentation.length, end: index - indentation.length, text: getLineBreak(root, result) } : { start: index - run.length, end: index, text: `` }
		}

		selectorListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			// `never-multi-line` may take away the break closing a `//` comment and put the comma into it; report and leave the code. `always` only adds a break.
			isFixable: (selector, index, inlineComments, ruleNode, runString) => {
				// The run in front of a comma opening the selector is at the end of `raws.before`, written there where it is the stylesheet's and no live neighbor writing that raw asks otherwise
				if (index === 0) {
					let written: EdgeWrite = primary.startsWith(`always`) ? `newline` : `none`

					return !edgeRunOutOfReach(ruleNode, syntax, result, written) && !edgeRunOwned(ruleNode, result, written)
				}

				let runStart = selector.slice(0, index).trimEnd().length
				let closesInlineComment = inlineComments.some((inlineComment) => runStart <= inlineComment.endIndex && inlineComment.endIndex < index)

				if (primary === `never-multi-line` && closesInlineComment) return false

				// A break written into parentheses PostCSS holds as one token other than an address's makes them code, and a `[` nothing closes inside is then a group the parser finds open and the file stops parsing: the break is refused there and the warning stands
				if (primary.startsWith(`always`) && breakAtRereadsParentheses(selector, index, false, syntax.inlineComments(ruleNode, result))) return false

				// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎,b` would come out as `a\,b`, one identifier, so the warning stands; `always` leaves the break the backslash stands in front of where it is
				return primary !== `never-multi-line` || editKeepsEscapedCharacter(selector, editAt(runString, index))
			},
			// Whitespace right behind the `(` of an address decides under PostCSS whether its parentheses are one token or code, and a run written into or taken out of parentheses held as one plain token can make them code or a token again, so that a later `(` pops another word; the writes of the node are asked together whether the parser then reads the file otherwise, along with what the list's other comma rules write around the same comma behind this one in the pass, since the run behind the comma, which a twin writes in the same pass, decides what the parentheses then hold
			edits: (selector, index, ruleNode, runString, sourceIndex) => editsAskedWithTheTwins(selector, runString, index, sourceIndex, editAt(runString, index), syntax.inlineComments(ruleNode, result), ruleNode, result, ruleName),
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut and no break parts it from its backslash
			fix: (ruleNode, index, runString) => {
				fixData = fixData || (new Map())

				let commas = fixData.get(ruleNode) || []

				commas.push([index, runInFront(runString, index)])
				fixData.set(ruleNode, commas)

				return true
			},
		})

		if (fixData) {
			for (let [ruleNode, commas] of fixData.entries()) {
				let copies = syntax.selectorCopies(ruleNode)
				let { selector } = copies

				for (let [index, run] of commas.toSorted(([a], [b]) => b - a)) {
					if (index === 0) {
						writeEdgeRun(ruleNode, (edge) => (primary.startsWith(`always`) ? getLineBreak(root, result) + (edge.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``) : ``))

						continue
					}

					let beforeSelector = selector.slice(0, index)
					let afterSelector = selector.slice(index)

					// The break goes in front of the spaces and tabs ending the run, which become the indentation of the comma's line
					if (primary.startsWith(`always`)) {
						let indentation = run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``

						beforeSelector = beforeSelector.slice(0, beforeSelector.length - indentation.length) + getLineBreak(root, result) + indentation
					}
					else if (primary === `never-multi-line`) beforeSelector = beforeSelector.slice(0, beforeSelector.length - run.length)
					selector = beforeSelector + afterSelector
				}

				copies.write(selector)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
