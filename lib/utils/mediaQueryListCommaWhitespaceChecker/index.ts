import type { AtRule, Root } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import { MEDIA_QUERY_COMBINATORS } from "../../reference/mediaQueries.ts"
import { LEADING_BLOCK_COMMENT, MEDIA_AT_RULE, OPENS_WITH_INLINE_COMMENT } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { findFunctionArgumentSpans } from "../findFunctionArgumentSpans/index.ts"
import { listLines, rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { type EdgeFix, type EdgeWrite, textBeforeAsLeft } from "../textEdge/index.ts"
import { type AskedWrites, leavesTheSharedRunToTheTwin } from "../twinWritesAtTheComma/index.ts"
import { assertString } from "../validateTypes/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"
import { writesGiven } from "../writesKeepingAddresses/index.ts"

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
	isFixable?: ((params: string, index: number, atRule: AtRule, runString: string, fix: EdgeFix | undefined) => boolean),

	/** What the rule writes in the raw behind the at-rule's name, where the comma opening the parameters stands, and nothing where it writes no fix there; the run in front of that comma lies there and nowhere else, so the rule is asked whether it may write it only once every write the other commas are given stands known ({@link EdgeFix}). */
	writtenAtTheEdge?: (atRule: AtRule) => EdgeWrite | undefined,

	/** The spans a fix would write, indexed in the params, and what a neighbor running behind it in the pass writes there; the index the problem is reported at in the at-rule's string comes last. Every fix of an at-rule is asked along with the others whether the writes switch how the tokenizer reads an address's parentheses ({@link writesGiven}), and one they refuse is reported without a fix. */
	edits: ((params: string, index: number, atRule: AtRule, runString: string, problemIndex: number) => AskedWrites),

	/** A guard of the fix reading the text around the write, asked over the text the at-rule's other writes leave ({@link writesGiven}), with the indices moved into it. */
	holds?: ((params: string, index: number, atRule: AtRule, runString: string) => (edited: string, move: (index: number) => number) => boolean),
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

		// The run in front of a comma opening the parameters lies in `raws.afterName`, comments and all
		let raw = rawInFrontOfText(atRule)
		let [edge] = commas
		let opensWithComma = edge?.comma === 0

		let lineCheckStr = listLines(atRule, runString, opensWithComma, opts.result)

		// Whether the rule may write the run at the head of the parameters is asked over its whole fix, once every write the other commas are given stands known, so the comma is checked last and its problems reported first
		let others = commas.slice(opensWithComma ? 1 : 0).flatMap((comma) => checkComma(params, runString, indexAt(comma), atRule, raw, lineCheckStr))
		// The writes the other commas are given, which the question at the edge is asked over; which fixes may be given is settled below, once the edge has been checked
		let { edits } = writesGiven(params, others, opts.syntax.inlineComments(atRule, opts.result), atRule, opts.result, opts.checkedRuleName)
		let edgeWritten = opts.writtenAtTheEdge?.(atRule)
		let edgeFix = fix && edgeWritten ? { written: edgeWritten, edits } : undefined
		let edgeProblems = opensWithComma && edge ? checkComma(params, runString, indexAt(edge), atRule, textBeforeAsLeft(atRule, raw, opts.result, edgeFix), lineCheckStr, edgeFix) : []
		// Stylelint counts a fixer as applied whatever it does, so which fixes are given is settled before the reports, and together, since the writes of one at-rule are asked about as one run. The comma opening the parameters comes last among them, so that a guard of its fix reads the writes the other commas were given, and a break refused out of one that does not stand in the parameters any more is given once another write has made them an address's token
		let { given } = writesGiven(params, [...others, ...edgeProblems], opts.syntax.inlineComments(atRule, opts.result), atRule, opts.result, opts.checkedRuleName)

		for (let [problemIndex, { message, index }] of edgeProblems.entries()) {
			report({
				message,
				node: atRule,
				index,
				endIndex: index,
				result: opts.result,
				ruleName: opts.checkedRuleName,
				...(fix && given[others.length + problemIndex] && { fix: (): void => fix(atRule, index, runString) }),
			})
		}

		for (let [problemIndex, { message, index }] of others.entries()) {
			report({
				message,
				node: atRule,
				index,
				endIndex: index,
				result: opts.result,
				ruleName: opts.checkedRuleName,
				...(fix && given[problemIndex] && { fix: (): void => fix(atRule, index, runString) }),
			})
		}
	})

	/**
	 * Reads the index a comma is checked at: past the comments trailing it on its line where the rule asks after them, at the comma itself otherwise.
	 * @param comma - The comma, and the index the check moves to past the comments trailing it on its line.
	 * @returns The index.
	 */
	function indexAt (comma: MediaQueryListComma): number {
		return opts.allowTrailingComments ? comma.pastComments : comma.comma
	}

	/**
	 * Checks one comma. The whitespace is read over the copy with its escapes masked, since an escaped space or the space closing a hexadecimal escape is a character of a word and no run.
	 * @param source - The at-rule's params the comma stands in.
	 * @param runString - The copy of them the runs are read over.
	 * @param index - The comma's index.
	 * @param node - The at-rule.
	 * @param textBefore - What the file holds in front of the parameters, where a comma opening them has its run.
	 * @param lineCheckStr - What the list's lineness is asked of.
	 * @param wholeFix - The rule's whole fix, where the comma opens the parameters and the rule may fix there.
	 * @returns The problems found, each at its index in the at-rule's string, with the spans its fix would write, or none where a guard refuses the fix.
	 */
	function checkComma (source: string, runString: string, index: number, node: AtRule, textBefore: string, lineCheckStr: string, wholeFix?: EdgeFix): { message: string, index: number, edits: Edit[] | undefined, assumed: Edit[] | undefined, holds: ((edited: string, move: (index: number) => number) => boolean) | undefined }[] {
		let problems: { message: string, index: number, edits: Edit[] | undefined, assumed: Edit[] | undefined, holds: ((edited: string, move: (index: number) => number) => boolean) | undefined }[] = []

		opts.locationChecker({
			source: runString,
			index,
			textBefore,
			lineCheckStr,
			err: (message) => {
				// Asked here, not in front of the check, so parameters in order are not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, node, runString, wholeFix)) && !leavesTheSharedRunToTheTwin(opts.checkedRuleName, runString, index, (i) => i + atRuleParamIndex(node), node, opts.result)
				let writes = isFixable ? opts.edits(source, index, node, runString, index + atRuleParamIndex(node)) : undefined

				problems.push({ message, index: index + atRuleParamIndex(node), edits: writes?.edits, assumed: writes?.assumed, holds: isFixable ? opts.holds?.(source, index, node, runString) : undefined })
			},
		})

		return problems
	}
}
