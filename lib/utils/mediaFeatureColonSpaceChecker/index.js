import styleSearch from "style-search"
import stylelint from "stylelint"

import { mediaQueryCombinators } from "../../reference/mediaQueries.js"
import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { searchCopy } from "../searchCopy/index.js"

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
		let { searchString } = searchCopy(params, atRule, opts.result)

		// A colon standing inside the arguments of a function belongs to those arguments and to no media
		// feature: the one in `url(http://x)` is part of the protocol, and a space written beside it
		// names no resource at all
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !mediaQueryCombinators.has(name))

		styleSearch({ source: searchString, target: `:` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			checkColon(params, index, atRule)
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
