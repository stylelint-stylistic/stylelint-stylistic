import styleSearch from "style-search"

import { mediaQueryCombinators } from "../../reference/mediaQueries.js"
import { closeInlineComments } from "../closeInlineComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"

let rangeOperators = [`>=`, `<=`, `>`, `<`, `=`]

/** @typedef {import('style-search').StyleSearchMatch} StyleSearchMatch */

/**
 * Finds media operator matches in an at-rule and invokes a callback for each.
 * @template {import('postcss').AtRule} T
 * @param {T} atRule - The at-rule to search.
 * @param {(match: StyleSearchMatch, params: string, atRule: T) => void} cb - The callback to invoke for each match.
 */
export function findMediaOperator (atRule, cb) {
	if (atRule.name.toLowerCase() !== `media`) return

	let params = getAtRuleParams(atRule)
	let spans = findInlineCommentSpans(params, endsInlineCommentOnFormFeed(atRule))
	// `style-search` ends an inline comment with a line feed and with nothing else, and opens one on a
	// double slash wherever it stands, the one in `url(http://x/y.png)` among them. The break closing
	// each real comment is written as a line feed for the search, and the false openings are spelled
	// out of harm's way, so that neither a comment nor an address hides the operators behind it; every
	// position stands where it did, and the callers are handed the parameters as they are spelled.
	let searchString = hideFalseInlineComments(closeInlineComments(params, spans), spans)

	// An operator standing inside the arguments of a function belongs to those arguments and to no
	// media feature, so the one in `url(a>=b)` is passed over as a comma there is
	let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !mediaQueryCombinators.has(name))

	styleSearch({ source: searchString, target: rangeOperators }, (match) => {
		let before = params[match.startIndex - 1]

		if (before === `>` || before === `<`) return

		if (functionArguments.some(({ start, end }) => match.startIndex >= start && match.startIndex < end)) return

		cb(match, params, atRule)
	})
}
