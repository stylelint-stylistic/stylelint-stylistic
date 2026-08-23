import styleSearch from "style-search"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.js"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.js"
import { getAtRuleParams } from "../getAtRuleParams/index.js"
import { searchCopy } from "../searchCopy/index.js"

// `styleSearch` tries the targets in the order they are given and reports the first that matches, so the two-character operators stand in front of the one-character ones and `>=` is read whole rather than as a `>` with an `=` behind it
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

	// The search goes on from the character behind the one a match opened at, so every two-character operator is reported a second time by its second character: the `=` of `>=` matches the `=` target one index later. Where the previous match ended says which readings those are, and it says it of the operator that was read rather than of the character in front of the one being read — a guard asking that character called the whole of `>=` a second reading of the `<` in front of it, and passed the operator over until a later run put a space between the two
	let readUpTo = 0

	styleSearch({ source: searchString, target: RANGE_OPERATORS }, (match) => {
		if (match.startIndex < readUpTo) return

		readUpTo = match.endIndex

		if (functionArguments.some(({ start, end }) => match.startIndex >= start && match.startIndex < end)) return

		cb(match, params, atRule)
	})
}
