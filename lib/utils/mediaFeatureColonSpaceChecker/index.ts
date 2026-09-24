import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { MEDIA_AT_RULE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"
import { report } from "../report/index.ts"

/**
 * Checks whitespace around the colons of media features.
 * @param opts - The options.
 */
export function mediaFeatureColonSpaceChecker (opts: {
	root: Root,
	locationChecker: (args: {
		source: string,
		index: number,
		err: (message: string) => void,
	}) => void,
	fix?: ((node: AtRule, index: number, runString: string) => void),
	isFixable?: ((params: string, index: number, atRule: AtRule, runString: string) => boolean),
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
}): void {
	let { fix } = opts

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		let params = opts.syntax.read(atRule)
		let { searchString, runString } = opts.syntax.searchCopy(params, atRule, opts.result)

		// A colon inside a function's arguments is no feature's: `url(http://x)`
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

		styleSearch({ source: searchString, target: `:` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			checkColon(params, runString, index, atRule)
		})
	})

	/**
	 * Checks one colon. The whitespace is read over the copy with its escapes masked, since an escaped space or the space closing a hexadecimal escape is a character of a word and no run (1789657288).
	 * @param source - The at-rule's params the colon stands in.
	 * @param runString - The copy of them the runs are read over.
	 * @param index - The colon's index.
	 * @param node - The at-rule.
	 */
	function checkColon (source: string, runString: string, index: number, node: AtRule): void {
		opts.locationChecker({
			source: runString,
			index,
			err: (message) => {
				let colonIndex = index + atRuleParamIndex(node)
				// Asked here, not in front of the check, so a clean colon is not asked about
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, node, runString))

				report({
					message,
					node,
					index: colonIndex,
					endIndex: colonIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, colonIndex, runString) }),
				})
			},
		})
	}
}
