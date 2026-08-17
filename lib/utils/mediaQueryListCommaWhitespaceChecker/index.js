import styleSearch from "style-search"
import stylelint from "stylelint"

import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { closeInlineComments } from "../closeInlineComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
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
 *   isFixable?: ((params: string, index: number) => boolean),
 *   allowTrailingComments?: boolean,
 * }} opts - The options object
 */
export function mediaQueryListCommaWhitespaceChecker (opts) {
	opts.root.walkAtRules(/^media$/iu, (atRule) => {
		let params = getAtRuleParams(atRule)
		// `style-search` skips the text of an inline comment, so that no code is read out of one, but it
		// ends such a comment with a line feed and with nothing else. A comment closed by a carriage
		// return would hide the rest of the parameters from it, so the text of every comment is blanked
		// out before the search and the search reads spaces where the comment stood. Every position
		// stays where it was, and the checks that follow are made against the parameters as they stand.
		// `style-search` skips the text of an inline comment, so that no code is read out of one, but it
		// ends such a comment with a line feed and with nothing else. Writing the break that closes each
		// of them as a line feed puts the end of the comment where the syntax puts it, and leaves every
		// position of the copy where it stands in the text itself, so the checks that follow are made
		// against the parameters as it stands.
		let searchString = closeInlineComments(params, findInlineCommentSpans(params, endsInlineCommentOnFormFeed(atRule)))

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let index = match.startIndex

			if (opts.allowTrailingComments) {
				// if there is a comment on the same line at after the comma, check the space after the comment.
				let execResult = (/^[^\S\r\n]*\/\*([\s\S]*?)\*\//u).exec(params.slice(index + 1))

				while (execResult) {
					assertString(execResult[0])
					index += execResult[0].length
					execResult = (/^[^\S\r\n]*\/\*([\s\S]*?)\*\//u).exec(params.slice(index + 1))
				}

				execResult = (/^([^\S\r\n]*\/\/[\s\S]*?)\r?\n/u).exec(params.slice(index + 1))

				if (execResult) {
					assertString(execResult[1])
					index += execResult[1].length
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
				// A rule may know that this particular problem cannot be fixed without breaking the code.
				// The question is asked here rather than in front of the check, so that a set of
				// parameters whose commas are all in order is not read through once per comma for nothing.
				let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(source, index))

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
