import styleSearch from "style-search"

import { closeInlineComments } from "../closeInlineComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"

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
	// `style-search` ends an inline comment with a line feed and with nothing else, so the break
	// closing each of them is written as one for the search, which leaves every position where it
	// stands and hands the callers the parameters as they are spelled
	let searchString = closeInlineComments(params, findInlineCommentSpans(params, endsInlineCommentOnFormFeed(atRule)))

	styleSearch({ source: searchString, target: rangeOperators }, (match) => {
		let before = params[match.startIndex - 1]

		if (before === `>` || before === `<`) return

		cb(match, params, atRule)
	})
}
