import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { LEADING_BLOCK_COMMENT, MEDIA_AT_RULE, OPENS_WITH_INLINE_COMMENT } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"
import { assertString } from "../validateTypes/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around the commas of media query lists.
 * @param opts - The options.
 */
export function mediaQueryListCommaWhitespaceChecker (opts: {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	locationChecker: (args: {
		source: string,
		index: number,
		err: (message: string) => void,
	}) => void,
	checkedRuleName: string,
	fix?: ((atRule: AtRule, index: number) => void),
	isFixable?: ((params: string, index: number, atRule: AtRule) => boolean),
	allowTrailingComments?: boolean,
}): void {
	let { fix } = opts

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		let params = opts.syntax.read(atRule)
		let { searchString, commentSpans } = opts.syntax.searchCopy(params, atRule, opts.result)

		// A comma inside a function's arguments is not the list's (`url(x/a,b.png)`), but a media feature's parentheses are not a call's
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			if (opts.allowTrailingComments) {
				// A block comment on the comma's line moves the check behind it
				let execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))

				while (execResult) {
					assertString(execResult[0])
					index += execResult[0].length
					execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))
				}

				// An inline comment ends with its line, on the break the syntax closes it with; the whitespace checked is behind its text
				execResult = OPENS_WITH_INLINE_COMMENT.exec(params.slice(index + 1))

				if (execResult) {
					let start = index + 1 + execResult[0].length - 2
					let inlineComment = commentSpans.find((span) => span.start === start)

					if (inlineComment && inlineComment.end < params.length) index = inlineComment.end - 1
				}
			}

			checkComma(params, index, atRule)
		})
	})

	/**
	 * Checks one comma.
	 * @param source - The at-rule's params the comma stands in.
	 * @param index - The comma's index.
	 * @param node - The at-rule.
	 */
	function checkComma (source: string, index: number, node: AtRule): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				let commaIndex = index + atRuleParamIndex(node)
				// Asked here, not in front of the check, so parameters in order are not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, node))

				report({
					message,
					node,
					index: commaIndex,
					endIndex: commaIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, commaIndex) }),
				})
			},
		})
	}
}
