import styleSearch from "style-search"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { searchCopy } from "../searchCopy/index.js"

const RANGE_OPERATORS = [`>=`, `<=`, `>`, `<`, `=`]

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
	let { searchString } = searchCopy(params, atRule, result)

	// An operator standing inside the arguments of a function belongs to those arguments and to no media feature, so the one in `url(a>=b)` is passed over as a comma there is
	let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

	styleSearch({ source: searchString, target: RANGE_OPERATORS }, (match) => {
		let before = params[match.startIndex - 1]

		if (before === `>` || before === `<`) return

		if (functionArguments.some(({ start, end }) => match.startIndex >= start && match.startIndex < end)) return

		cb(match, params, atRule)
	})
}
