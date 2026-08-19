import styleSearch from "style-search"
import stylelint from "stylelint"

import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { closeInlineComments } from "../closeInlineComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
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
		let inlineComments = findInlineCommentSpans(params, endsInlineCommentOnFormFeed(atRule))
		// `style-search` reads the inline comments of the parameters for itself, and reads them by two
		// rules of its own: a comment ends on a line feed and on nothing else, and a double slash opens
		// one wherever it stands, the one in `url(http://x/y.png)` among them. A comment closed by a
		// carriage return would therefore hide the rest of the parameters from the search, and an
		// address would hide every query behind it. The copy handed to the search closes each real
		// comment where the syntax closes it and spells every false opening out of harm's way; it is as
		// long as the parameters and spells them character for character everywhere else, so every
		// position stands where it did, and the checks that follow are made against the parameters as
		// they stand.
		let searchString = hideFalseInlineComments(closeInlineComments(params, inlineComments), inlineComments)

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let index = match.startIndex

			if (opts.allowTrailingComments) {
				// if there is a comment on the same line at after the comma, check the space after the comment.
				// A bare carriage return and a form feed end a line as readily as a line feed, so neither counts as the horizontal whitespace such a comment may stand behind
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
					let inlineComment = inlineComments.find((span) => span.start === start)

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
