import stylelint from "stylelint"

import isStandardSyntaxAtRule from "./isStandardSyntaxAtRule.js"

let { utils: { report } } = stylelint

/**
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: (opts: { source: string, index: number, err: (msg: string) => void, errTarget: string }) => void,
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 *   fix?: ((atRule: import('postcss').AtRule) => void) | null,
 * }} options
 */
export default function atRuleNameSpaceChecker (options) {
	options.root.walkAtRules((atRule) => {
		if (!isStandardSyntaxAtRule(atRule)) {
			return
		}

		checkColon(
			`@${atRule.name}${atRule.raws.afterName || ``}${atRule.params}`,
			atRule.name.length,
			atRule,
		)
	})

	/**
	 * @param {string} source
	 * @param {number} index
	 * @param {import('postcss').AtRule} node
	 */
	function checkColon (source, index, node) {
		options.locationChecker({
			source,
			index,
			err: (m) => {
				report({
					message: m,
					node,
					index,
					endIndex: index,
					result: options.result,
					ruleName: options.checkedRuleName,
					fix: options.fix ? () => options.fix(node) : undefined,
				})
			},
			errTarget: `@${node.name}`,
		})
	}
}
