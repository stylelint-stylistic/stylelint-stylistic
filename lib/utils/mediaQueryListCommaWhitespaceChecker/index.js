import styleSearch from "style-search"
import stylelint from "stylelint"

import { mediaQueryCombinators } from "../../reference/mediaQueries.js"
import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { searchCopy } from "../searchCopy/index.js"
import { assertString } from "../validateTypes/index.js"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around commas in media query lists.
 * @param {{
 *   root: import('postcss').Root,
 *   result: import('stylelint').PostcssResult,
 *   locationChecker: (args: { source: string, index: number, err: (message: string) => void }) => void,
 *   checkedRuleName: string,
 *   fix?: ((atRule: import('postcss').AtRule, index: number) => boolean) | undefined,
 *   isFixable?: ((params: string, index: number, atRule: import('postcss').AtRule) => boolean),
 *   allowTrailingComments?: boolean,
 * }} opts - The options object.
 */
export function mediaQueryListCommaWhitespaceChecker (opts) {
	opts.root.walkAtRules(/^media$/iu, (atRule) => {
		let params = getAtRuleParams(atRule)
		let { searchString, commentSpans } = searchCopy(params, atRule, opts.result)

		// A comma standing inside the arguments of a function is a comma of those arguments and of no list: the one in `url(x/a,b.png)` names the file as surely as the letters around it do, and whitespace written beside it would name another file. `valueListCommaWhitespaceChecker` has asked the search itself to pass such a comma over since it was written; the search cannot be asked here, since it reads the parenthesis a set of media parameters opens on as the opening of a call and would pass over the whole of the first query.
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !mediaQueryCombinators.has(name))

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let index = match.startIndex

			if (functionArguments.some(({ start, end }) => index >= start && index < end)) return

			if (opts.allowTrailingComments) {
				// if there is a comment on the same line at after the comma, check the space after the comment. A bare carriage return and a form feed end a line as readily as a line feed, so neither counts as the horizontal whitespace such a comment may stand behind
				let execResult = (/^[^\S\n\r\f]*\/\*([\s\S]*?)\*\//u).exec(params.slice(index + 1))

				while (execResult) {
					assertString(execResult[0])
					index += execResult[0].length
					execResult = (/^[^\S\n\r\f]*\/\*([\s\S]*?)\*\//u).exec(params.slice(index + 1))
				}

				// An inline comment standing there ends with its line, whichever break closes it — the spans know which one the syntax reads — and the whitespace checked is the one behind the comment's text
				execResult = (/^[^\S\n\r\f]*\/\//u).exec(params.slice(index + 1))

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
	 * @param {string} source - The source string.
	 * @param {number} index - The index to check.
	 * @param {import('postcss').AtRule} node - The at-rule node.
	 */
	function checkComma (source, index, node) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				let commaIndex = index + atRuleParamIndex(node)
				// A rule may know that this particular problem cannot be fixed without breaking the code. The question is asked here rather than in front of the check, so that a set of parameters whose commas are all in order is not read through once per comma for nothing.
				let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(source, index, node))

				report({
					message,
					node,
					index: commaIndex,
					endIndex: commaIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: isFixable ? () => opts.fix(node, commaIndex) : undefined,
				})
			},
		})
	}
}
