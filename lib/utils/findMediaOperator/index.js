import styleSearch from "style-search"

import { mediaQueryCombinators } from "../../reference/mediaQueries.js"
import { blankComments } from "../blankComments/index.js"
import { endsInlineCommentOnFormFeed } from "../endsInlineCommentOnFormFeed/index.js"
import { findCommentSpans } from "../findCommentSpans/index.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { hideFalseInlineComments } from "../hideFalseInlineComments/index.js"
import { readsInlineComments } from "../readsInlineComments/index.js"

let rangeOperators = [`>=`, `<=`, `>`, `<`, `=`]

/** @typedef {import('style-search').StyleSearchMatch} StyleSearchMatch */

/**
 * Finds media operator matches in an at-rule and invokes a callback for each.
 * @template {import('postcss').AtRule} T
 * @param {T} atRule - The at-rule to search.
 * @param {import('stylelint').PostcssResult} result - The Stylelint result, which the syntax of the file is read from.
 * @param {(match: StyleSearchMatch, params: string, atRule: T) => void} cb - The callback to invoke for each match.
 */
export function findMediaOperator (atRule, result, cb) {
	if (atRule.name.toLowerCase() !== `media`) return

	let params = getAtRuleParams(atRule)
	// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells
	// none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence
	// everything standing behind it on the line — the scan is told, rather than asked to find comments
	// and have them taken away afterwards, since what it reads behind such a pair depends on the answer
	let commentSpans = findCommentSpans(params, endsInlineCommentOnFormFeed(atRule), readsInlineComments(atRule, result))
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
