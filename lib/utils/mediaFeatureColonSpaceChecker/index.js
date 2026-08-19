import styleSearch from "style-search"
import stylelint from "stylelint"

import { mediaQueryCombinators } from "../../reference/mediaQueries.js"
import { atRuleParamIndex } from "../atRuleParamIndex/index.js"
import { blankComments } from "../blankComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"

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
		// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells
		// none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence
		// everything standing behind it on the line — the scan is told, rather than asked to find
		// comments and have them taken away afterwards, since what it reads behind such a pair
		// depends on the answer
		let commentSpans = findCommentSpans(params, endsInlineCommentOnFormFeed(atRule), readsInlineComments(atRule, opts.result))
		// `style-search` reads the comments of the text for itself, and by rules of its own: an inline
		// comment ends on a line feed and on nothing else, a double slash opens one wherever it stands —
		// the one in `url(http://x/y.png)` among them — and the `*/` closing one block comment and the
		// `/*` opening the next are read as the two slashes of a third. The copy handed to the search has
		// every comment blanked out of it and every false opening spelled out of harm's way, so that none
		// of the three readings is left to make. It is as long as the text and spells it character for
		// character everywhere else, so every position stands where it did, and the checks that follow are
		// made against the text as it stands.
		// The masking is handed no spans because the blanking left it none to guard: every comment is
		// gone from the copy, so every double slash still standing in it opens none
		let searchString = hideFalseInlineComments(blankComments(params, commentSpans), [])

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
