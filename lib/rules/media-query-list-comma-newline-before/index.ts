import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { TRAILING_SPACES_AND_TABS } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { breakAtRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { edgeRunOutOfReach, edgeRunOwned, writeEdgeRun } from "../../utils/textEdge/index.ts"
import { editsAskedWithTheTwins } from "../../utils/twinWritesAtTheComma/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-newline-before`

const MESSAGES = defineMessages({
	expectedBefore: () => `Expected newline before ","`,
	expectedBeforeMultiLine: () => `Expected newline before "," in a multi-line list`,
	rejectedBeforeMultiLine: () => `Unexpected whitespace before "," in a multi-line list`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a newline before the commas; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line media query list only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace before the commas of media query lists.
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

		let fixData: Map<AtRule, [number, string][]> | undefined

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

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.beforeAllowingIndentation,
			checkedRuleName: ruleName,
			writtenAtTheEdge: () => (primary.startsWith(`always`) ? `newline` : `space`),
			// `never-multi-line` may take away the break closing a `//` comment and put the comma into it; report and leave the parameters. `always` only adds a break.
			isFixable: (params, index, atRule, runString, fix) => {
				// The run in front of a comma opening the parameters is `raws.afterName`, written there where it is the stylesheet's and no live neighbor writing that raw asks otherwise; emptied, it would join the name to the parameters, so `never-multi-line` writes one space there. The neighbor's lineness is read over the whole fix, so the check comes after the writes the other commas are given
				if (index === 0) return fix !== undefined && !edgeRunOutOfReach(atRule, syntax, result, fix.written) && !edgeRunOwned(atRule, result, fix)

				let closesInlineComment = syntax.endsWithInlineComment(params.slice(0, index), syntax.inlineComments(atRule, result))

				if (primary === `never-multi-line` && closesInlineComment) return false

				// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎,b` would come out as `a\,b`, one identifier, so the warning stands; `always` leaves the break the backslash stands in front of where it is
				return primary !== `never-multi-line` || editKeepsEscapedCharacter(params, editAt(runString, index))
			},
			// The space written at the edge of the list is nothing a multi-line list refuses only while the list is on one line once the runs in front of its other commas are taken out; which of them a fix may take is asked together ({@link writesGiven}), so the edge reads the parameters as the writes given leave them, and where one is refused the list stays multi-line and the space would be reported again — the write is left out and the warning stands
			// Asked over the text the list's other writes leave, including a neighbor gluing the run behind the comma, so the guard sees the parentheses as the parser will
			holds: (params, index, atRule, _runString) => (edited, move): boolean => (index !== 0 || primary !== `never-multi-line` || isSingleLineString(edited)) && (!primary.startsWith(`always`) || !breakAtRereadsParentheses(edited, move(index), true, syntax.inlineComments(atRule, result))),
			// Whitespace right behind the `(` of an address decides under PostCSS whether its parentheses are one token or code, and a run written into or taken out of parentheses held as one plain token can make them code or a token again, so that a later `(` pops another word; the writes of the node are asked together whether the parser then reads the file otherwise, along with what the list's other comma rules write around the same comma behind this one in the pass, since the run behind the comma, which a twin writes in the same pass, decides what the parentheses then hold
			edits: (params, index, atRule, runString, problemIndex) => editsAskedWithTheTwins(params, runString, index, problemIndex, editAt(runString, index), syntax.inlineComments(atRule, result), atRule, result, ruleName),
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut and no break parts it from its backslash
			fix: (atRule, index, runString) => {
				let paramCommaIndex = index - atRuleParamIndex(atRule)

				fixData = fixData || (new Map())

				let commas = fixData.get(atRule) || []

				commas.push([paramCommaIndex, runInFront(runString, paramCommaIndex)])
				fixData.set(atRule, commas)

				return true
			},
		})

		if (fixData) {
			for (let [atRule, commas] of fixData.entries()) {
				let params = syntax.read(atRule)

				for (let [index, run] of commas.toSorted(([a], [b]) => b - a)) {
					if (index === 0) {
						writeEdgeRun(atRule, (edge) => (primary.startsWith(`always`) ? getLineBreak(root, result) + (edge.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``) : ` `))

						continue
					}

					let beforeComma = params.slice(0, index)
					let afterComma = params.slice(index)

					// The break goes in front of the spaces and tabs ending the run, which become the indentation of the comma's line
					if (primary.startsWith(`always`)) {
						let indentation = run.match(TRAILING_SPACES_AND_TABS)?.[0] ?? ``

						beforeComma = beforeComma.slice(0, beforeComma.length - indentation.length) + getLineBreak(root, result) + indentation
					}
					else if (primary === `never-multi-line`) beforeComma = beforeComma.slice(0, beforeComma.length - run.length)
					params = beforeComma + afterComma
				}

				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
