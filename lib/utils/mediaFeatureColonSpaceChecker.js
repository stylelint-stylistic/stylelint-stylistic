import stylelint from "stylelint"
import styleSearch from "style-search"

import atRuleParamIndex from "./atRuleParamIndex.js"

let { utils: { report } } = stylelint

/**
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: (args: { source: string, index: number, err: (message: string) => void }) => void,
 *   fix: ((node: import('postcss').AtRule, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts
 */
export default function mediaFeatureColonSpaceChecker (opts) {
	opts.root.walkAtRules(/^media$/i, (atRule) => {
		let params = atRule.raws.params ? atRule.raws.params.raw : atRule.params

		styleSearch({ source: params, target: `:` }, (match) => {
			checkColon(params, match.startIndex, atRule)
		})
	})

	/**
	 * @param {string} source
	 * @param {number} index
	 * @param {import('postcss').AtRule} node
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
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: opts.fix ? () => opts.fix(node, colonIndex) : undefined,
				})
			},
		})
	}
}
