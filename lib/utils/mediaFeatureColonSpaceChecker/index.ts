import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { MEDIA_AT_RULE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"

let { utils: { report } } = stylelint

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
	fix?: ((node: AtRule, index: number) => void),
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,
}): void {
	let { fix } = opts

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		let params = opts.syntax.read(atRule)
		let { searchString } = opts.syntax.searchCopy(params, atRule, opts.result)

		// A colon inside a function's arguments is no feature's: `url(http://x)`
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

		styleSearch({ source: searchString, target: `:` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			checkColon(params, index, atRule)
		})
	})

	/**
	 * Checks one colon.
	 * @param source - The at-rule's params the colon is checked in.
	 * @param index - The colon's index.
	 * @param node - The at-rule.
	 */
	function checkColon (source: string, index: number, node: AtRule): void {
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
					...(fix && { fix: (): void => fix(node, colonIndex) }),
				})
			},
		})
	}
}
