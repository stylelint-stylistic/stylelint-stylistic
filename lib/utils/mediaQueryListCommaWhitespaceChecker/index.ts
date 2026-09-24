import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { LEADING_BLOCK_COMMENT, MEDIA_AT_RULE, OPENS_WITH_INLINE_COMMENT } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"
import { rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { assertString } from "../validateTypes/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"

/** A comma of a media query list: its index in the params, and the index the check moves to past the comments trailing it on its line. */
type MediaQueryListComma = {
	comma: number,
	pastComments: number,
}

/**
 * Checks whitespace around the commas of media query lists.
 * @param opts - The options.
 */
export function mediaQueryListCommaWhitespaceChecker (opts: {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	locationChecker: WhitespaceChecker,
	checkedRuleName: string,
	fix?: ((atRule: AtRule, index: number, runString: string) => void),
	isFixable?: ((params: string, index: number, atRule: AtRule, runString: string) => boolean),
	allowTrailingComments?: boolean,
}): void {
	let { fix } = opts

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		let params = opts.syntax.read(atRule)
		let { searchString, runString, commentSpans } = opts.syntax.searchCopy(params, atRule, opts.result)

		// A comma inside a function's arguments is not the list's (`url(x/a,b.png)`), but a media feature's parentheses are not a call's
		let functionArguments = findFunctionArgumentSpans(searchString).filter(({ name }) => !MEDIA_QUERY_COMBINATORS.has(name))

		let commas: MediaQueryListComma[] = []

		styleSearch({ source: searchString, target: `,` }, (match) => {
			let comma = match.startIndex

			if (functionArguments.some(({ start, end }) => comma >= start && comma < end)) return

			let index = comma
			// A block comment on the comma's line moves the check behind it
			let execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))

			while (execResult) {
				assertString(execResult[0])
				index += execResult[0].length
				execResult = LEADING_BLOCK_COMMENT.exec(params.slice(index + 1))
			}

			// An inline comment ends with its line, on the break the syntax closes it with; the whitespace checked is behind its text
			execResult = OPENS_WITH_INLINE_COMMENT.exec(params.slice(index + 1))

			if (execResult) {
				let start = index + 1 + execResult[0].length - 2
				let inlineComment = commentSpans.find((span) => span.start === start)

				if (inlineComment && inlineComment.end < params.length) index = inlineComment.end - 1
			}

			commas.push({
				comma,
				pastComments: index,
			})
		})

		// The run in front of a comma opening the parameters lies in `raws.afterName`, comments and all (1789593917)
		let textBefore = rawInFrontOfText(atRule)

		for (let { comma, pastComments } of commas) checkComma(params, runString, opts.allowTrailingComments ? pastComments : comma, atRule, textBefore)
	})

	/**
	 * Checks one comma. The whitespace is read over the copy with its escapes masked, since an escaped space or the space closing a hexadecimal escape is a character of a word and no run (1789657288).
	 * @param source - The at-rule's params the comma stands in.
	 * @param runString - The copy of them the runs are read over.
	 * @param index - The comma's index.
	 * @param node - The at-rule.
	 * @param textBefore - What the file holds in front of the parameters, where a comma opening them has its run (1789593917).
	 */
	function checkComma (source: string, runString: string, index: number, node: AtRule, textBefore: string): void {
		opts.locationChecker({
			source: runString,
			index,
			textBefore,
			err: (message) => {
				let commaIndex = index + atRuleParamIndex(node)
				// Asked here, not in front of the check, so parameters in order are not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, node, runString))

				report({
					message,
					node,
					index: commaIndex,
					endIndex: commaIndex,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					...(fix && isFixable && { fix: (): void => fix(node, commaIndex, runString) }),
				})
			},
		})
	}
}
