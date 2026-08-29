import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import stylelint, { type PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { LEADING_BLOCK_COMMENT, MEDIA_AT_RULE, OPENS_WITH_INLINE_COMMENT } from "../../regexps.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"
import { getAtRuleParams } from "../getAtRuleParams/index.ts"
import { searchCopy } from "../searchCopy/index.ts"
import { assertString } from "../validateTypes/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around commas in media query lists.
 * @param opts - The options object.
 */
export function mediaQueryListCommaWhitespaceChecker (opts: {
	root: Root,
	result: PostcssResult,
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
		let params = getAtRuleParams(atRule)
		let { searchString, commentSpans } = searchCopy(params, atRule, opts.result)

		// A comma standing inside the arguments of a function is a comma of those arguments and of no list: the one in `url(x/a,b.png)` names the file as surely as the letters around it do, and whitespace written beside it would name another file. `valueListCommaWhitespaceChecker` has asked the search itself to pass such a comma over since it was written; the search cannot be asked here, since it reads the parenthesis a set of media parameters opens on as the opening of a call and would pass over the whole of the first query.
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			if (opts.allowTrailingComments) {
				// if there is a comment on the same line at after the comma, check the space after the comment. The horizontal whitespace such a comment may stand behind runs up to the first line feed and no further
				let execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))

				while (execResult) {
					assertString(execResult[0])
					index += execResult[0].length
					execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))
				}

				// An inline comment standing there ends with its line, whichever break closes it — the spans know which one the syntax reads — and the whitespace checked is the one behind the comment's text
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
	 * Checks a comma for whitespace violations.
	 * @param source - The source string.
	 * @param index - The index to check.
	 * @param node - The at-rule node.
	 */
	function checkComma (source: string, index: number, node: AtRule): void {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				let commaIndex = index + atRuleParamIndex(node)
				// A rule may know that this particular problem cannot be fixed without breaking the code. The question is asked here rather than in front of the check, so that a set of parameters whose commas are all in order is not read through once per comma for nothing.
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, node))

				report({
					message,
					node,
					index: commaIndex,
					endIndex: commaIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: fix && isFixable ? (): void => fix(node, commaIndex) : undefined,
				})
			},
		})
	}
}
