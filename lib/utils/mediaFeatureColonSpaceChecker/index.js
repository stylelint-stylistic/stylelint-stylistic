import styleSearch from "style-search"
import stylelint from "stylelint"

import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { closeInlineComments } from "../closeInlineComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around colons in media feature declarations.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: (args: { source: string, index: number, err: (message: string) => void }) => void,
 *   fix: ((node: import('postcss').AtRule, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts - The options object
 */
export function mediaFeatureColonSpaceChecker (opts) {
	opts.root.walkAtRules(/^media$/iu, (atRule) => {
		let params = getAtRuleParams(atRule)
		// `style-search` ends an inline comment with a line feed and with nothing else, so the break
		// closing each of them is written as one for the search, which leaves every position where it
		// stands and hands the callers the parameters as they are spelled
		let searchString = closeInlineComments(params, findInlineCommentSpans(params, endsInlineCommentOnFormFeed(atRule)))

		styleSearch({ source: searchString, target: `:` }, (match) => {
			checkColon(params, match.startIndex, atRule)
		})
	})

	/**
	 * Checks a colon for whitespace violations.
	 * @param {string} source - The source string.
	 * @param {number} index - The index of the colon.
	 * @param {import('postcss').AtRule} node - The at-rule node.
	 */
	function checkColon (source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				let colonIndex = index + atRuleParamIndex(node)

				report({
					message,
					node,
					index: colonIndex,
					endIndex: colonIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: opts.fix ? () => opts.fix(node, colonIndex) : undefined,
				})
			},
		})
	}
}
