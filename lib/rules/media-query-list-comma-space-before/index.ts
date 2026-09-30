import type { AtRule } from "postcss"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import type { Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editKeepsEscapedCharacter } from "../../utils/editKeepsEscapedCharacter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { mediaQueryListCommaWhitespaceChecker } from "../../utils/mediaQueryListCommaWhitespaceChecker/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInFront } from "../../utils/runInFront/index.ts"
import { edgeRunOutOfReach, edgeRunOwned, writeEdgeRun } from "../../utils/textEdge/index.ts"
import { editsAskedWithTheTwins } from "../../utils/twinWritesAtTheComma/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `media-query-list-comma-space-before`

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

/** `always` a single space before the commas, `never` no whitespace; the `-single-line` forms in a single-line media query list only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/**
 * Requires a single space or disallows whitespace before the commas of media query lists.
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

		let fixData: Map<AtRule, [number, string][]> | undefined

		/**
		 * Builds the write in front of a comma: the run there, as the check measured it over the copy, replaced by a space or by nothing.
		 * @param runString - The copy the runs are read over.
		 * @param index - The comma's index.
		 * @returns The edit.
		 */
		function editAt (runString: string, index: number): Edit {
			let run = runInFront(runString, index)

			return { start: index - run.length, end: index, text: primary.startsWith(`always`) ? ` ` : `` }
		}

		mediaQueryListCommaWhitespaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.before,
			checkedRuleName: ruleName,
			// The fix's whitespace ends this text, and its break would close an inline comment standing there, taking the comma into the comment: leave the parameters alone
			isFixable: (params, index, atRule, runString) => {
				// The run in front of a comma opening the parameters is `raws.afterName`, written there where it is the stylesheet's and no live neighbor writing that raw asks otherwise; emptied, it would join the name to the parameters, so `never` is left unfixed
				if (index === 0) return primary.includes(`always`) && !edgeRunOutOfReach(atRule, syntax, result, `space`) && !edgeRunOwned(atRule, result, `space`)

				if (syntax.endsWithInlineComment(params.slice(0, index), syntax.inlineComments(atRule, result))) return false

				// A backslash in front of a line break is a delimiter, and what is written behind it is read as its escape: `a\⏎,b` would come out as `a\,b`, one identifier, or `a\ ,b`, an escaped space, so the warning stands
				return editKeepsEscapedCharacter(params, editAt(runString, index))
			},
			// Whitespace right behind the `(` of an address decides under PostCSS whether its parentheses are one token or code, and a run written into or taken out of parentheses held as one plain token can make them code or a token again, so that a later `(` pops another word; the writes of the node are asked together whether the parser then reads the file otherwise, along with what the list's other comma rules write around the same comma behind this one in the pass, since the run behind the comma, which a twin writes in the same pass, decides what the parentheses then hold
			edits: (params, index, atRule, runString, problemIndex) => editsAskedWithTheTwins(params, runString, index, problemIndex, editAt(runString, index), syntax.inlineComments(atRule, result), atRule, result, ruleName),
			// The run is the check's, read over the copy with its escapes masked, so the space of `a\ ,b` is not cut
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
						writeEdgeRun(atRule, () => ` `)

						continue
					}

					let beforeComma = params.slice(0, index - run.length)
					let afterComma = params.slice(index)

					params = beforeComma + (primary.startsWith(`always`) ? ` ` : ``) + afterComma
				}
				syntax.write(atRule, params)
			}
		}
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
