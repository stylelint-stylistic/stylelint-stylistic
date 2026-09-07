import type { AtRule } from "postcss"
import styleSearch, { type StyleSearchMatch } from "style-search"
import type { PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"

// Two-character operators first; `styleSearch` takes the first match
const RANGE_OPERATORS = [`>=`, `<=`, `>`, `<`, `=`]

/**
 * Calls back for every range operator in a `@media` at-rule's params.
 * @param syntax - The syntax the at-rule's params are read under.
 * @param atRule - The at-rule.
 * @param result - The Stylelint result.
 * @param cb - Called with each match.
 */
export function findMediaOperator<T extends AtRule> (syntax: Syntax, atRule: T, result: PostcssResult, cb: (match: StyleSearchMatch, params: string, atRule: T) => void): void {
	if (atRule.name.toLowerCase() !== `media`) return

	let params = syntax.read(atRule)
	let { searchString } = syntax.searchCopy(params, atRule, result)

	// An operator inside function arguments is no media feature's
	let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

	// The `=` of `>=` matches again a character on and is dropped; reading the character in front instead misread `<>=`
	let readUpTo = 0

	styleSearch({ source: searchString, target: RANGE_OPERATORS }, (match) => {
		if (match.startIndex < readUpTo) return

		readUpTo = match.endIndex

		if (functionArguments.some(({ start, end }) => match.startIndex >= start && match.startIndex < end)) return

		cb(match, params, atRule)
	})
}
