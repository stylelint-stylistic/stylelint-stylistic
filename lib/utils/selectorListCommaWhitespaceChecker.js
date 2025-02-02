import stylelint from "stylelint"
import styleSearch from "style-search"

import isStandardSyntaxRule from "./isStandardSyntaxRule.js"

let { utils: { report } } = stylelint

/**
 * @param {{
 *   root: import('postcss').Root,
 *   result: import('stylelint').PostcssResult,
 *   locationChecker: (opts: { source: string, index: number, err: (msg: string) => void }) => void,
 *   checkedRuleName: string,
 *   fix: ((rule: import('postcss').Rule, index: number) => boolean),
 * }} opts
 * @returns {void}
 */
export default function selectorListCommaWhitespaceChecker (opts) {
	opts.root.walkRules((rule) => {
		if (!isStandardSyntaxRule(rule)) {
			return
		}

		let selector = rule.raws.selector ? rule.raws.selector.raw : rule.selector

		styleSearch(
			{
				source: selector,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				checkDelimiter(selector, match.startIndex, rule)
			},
		)
	})

	/**
	 * @param {string} source
	 * @param {number} index
	 * @param {import('postcss').Rule} node
	 */
	function checkDelimiter (source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				report({
					message,
					node,
					index,
					endIndex: index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: opts.fix ? () => opts.fix(node, index) : undefined,
				})
			},
		})
	}
}
