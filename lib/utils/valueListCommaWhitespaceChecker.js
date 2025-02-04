import stylelint from "stylelint"
import styleSearch from "style-search"

import isStandardSyntaxDeclaration from "./isStandardSyntaxDeclaration.js"
import isStandardSyntaxProperty from "./isStandardSyntaxProperty.js"

let { utils: { report } } = stylelint

/**
 * @param {{
 *   root: import('postcss').Root,
 *   result: import('stylelint').PostcssResult,
 *   locationChecker: (opts: { source: string, index: number, err: (msg: string) => void }) => void,
 *   checkedRuleName: string,
 *   fix?: ((node: import('postcss').Declaration, index: number) => boolean),
 *   determineIndex?: (declString: string, match: import('style-search').StyleSearchMatch) => number | false,
 * }} opts
 */
export default function valueListCommaWhitespaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl) || !isStandardSyntaxProperty(decl.prop)) {
			return
		}

		let declString = decl.toString()

		styleSearch(
			{
				source: declString,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				let indexToCheckAfter = opts.determineIndex ? opts.determineIndex(declString, match) : match.startIndex

				if (indexToCheckAfter === false) {
					return
				}

				checkComma(declString, indexToCheckAfter, decl)
			},
		)
	})

	/**
	 * @param {string} source
	 * @param {number} index
	 * @param {import('postcss').Declaration} node
	 * @returns {void}
	 */
	function checkComma (source, index, node) {
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
