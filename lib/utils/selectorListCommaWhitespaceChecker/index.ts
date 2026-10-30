import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import type { SelectorCopies, Syntax } from "../../syntaxes/index.ts"
import type { InlineComment } from "../../syntaxes/index.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import { listLines, rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"
import { type EdgeFix, type EdgeWrite, textBeforeAsLeft } from "../textEdge/index.ts"
import { type AskedWrites, leavesTheSharedRunToTheTwin } from "../twinWritesAtTheComma/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"
import { writesGiven } from "../writesKeepingAddresses/index.ts"

export interface SelectorListCommaWhitespaceCheckerOptions {

	/** The root. */
	root: Root,

	/** The result. */
	result: PostcssResult,

	/** The syntax. */
	syntax: Syntax,

	/** The location checker. */
	locationChecker: WhitespaceChecker,

	/** The rule's name. */
	checkedRuleName: string,

	/** The fix; the copy the runs are read over comes along, so a fix cuts the run the check measured. */
	fix?: ((rule: Rule, index: number, runString: string) => void),

	/** Whether a problem can be fixed, since Stylelint counts a fixer as applied whatever it does; the rule, the comma's index in its source, every comma of the list and the copy the runs are read over come along. */
	isFixable?: ((selector: string, index: number, inlineComments: InlineComment[], rule: Rule, runString: string, fix: EdgeFix | undefined) => boolean),

	/** A guard of the fix reading the text around the write, asked over the text the selector's other writes leave ({@link writesGiven}), with the indices moved into it. */
	holds?: ((selector: string, index: number, rule: Rule, runString: string) => (edited: string, move: (index: number) => number) => boolean),

	/** What the rule writes in the raw in front of the selector, where the comma opening it stands, and nothing where it writes no fix there; the run in front of that comma lies there and nowhere else, so the rule is asked whether it may write it only once every write the other commas are given stands known ({@link EdgeFix}). */
	writtenAtTheEdge?: (rule: Rule) => EdgeWrite | undefined,

	/** The spans a fix would write, indexed in the selector the commas are found in, and what a neighbor running behind it in the pass writes there; the index the problem is reported at in the rule's source comes last. Every fix of a rule is asked along with the others whether the writes switch how the tokenizer reads an address's parentheses ({@link writesGiven}), and one they refuse is reported without a fix. */
	edits: ((selector: string, index: number, rule: Rule, runString: string, sourceIndex: number) => AskedWrites),
}

/**
 * Checks whitespace around commas in selector lists.
 * @param opts - The options.
 */
export function selectorListCommaWhitespaceChecker (opts: SelectorListCommaWhitespaceCheckerOptions): void {
	let { fix } = opts

	opts.root.walkRules((rule) => {
		if (!opts.syntax.isStandardRule(rule)) return

		let copies = opts.syntax.selectorCopies(rule)
		let { selector } = copies

		let raw = rawInFrontOfText(rule)
		let commaIndices: number[] = []
		// The search reads a string and an escape by rules of its own, so the commas are found and checked over the copies and reported at the selector's index; the whitespace is read over the second copy, where an escaped space is a character of a name and no run
		let { searchString, runString } = selectorSearchCopy(selector)

		styleSearch(
			{
				source: searchString,
				target: `,`,
				functionArguments: `skip`,
			},
			(match) => {
				commaIndices.push(match.startIndex)
			},
		)

		let lineCheckStr = listLines(rule, runString, commaIndices[0] === 0, opts.result)

		// The run in front of a comma opening the selector lies in `raws.before`, so whether the rule may write it there is asked over its whole fix, once every write the other commas are given stands known; the comma is therefore checked last and its problems reported first
		let opensWithComma = commaIndices[0] === 0
		let [edge] = commaIndices
		let others = commaIndices.slice(opensWithComma ? 1 : 0).flatMap((index) => checkDelimiter(selector, runString, index, rule, copies, raw, lineCheckStr))
		// The writes the other commas are given, which the question at the edge is asked over; which fixes may be given is settled below, once the edge has been checked
		// The problems are placed at their index in the rule's source, where Stylelint reads the line a disable comment covers
		let { edits: givenEdits } = writesGiven(selector, others.map(({ edits, assumed, holds, sourceIndex }) => ({ edits, assumed, holds, index: sourceIndex })), opts.syntax.inlineComments(rule, opts.result), rule, opts.result, opts.checkedRuleName)
		let edgeWritten = opts.writtenAtTheEdge?.(rule)
		let edgeFix = fix && edgeWritten ? { written: edgeWritten, edits: givenEdits } : undefined
		let edgeProblems = opensWithComma && edge !== undefined ? checkDelimiter(selector, runString, edge, rule, copies, textBeforeAsLeft(rule, raw, opts.result, edgeFix), lineCheckStr, edgeFix) : []
		// Stylelint counts a fixer as applied whatever it does, so which fixes are given is settled before the reports, and together, since the writes of one rule are asked about as one run. The comma opening the selector comes last among them, so that a guard of its fix reads the writes the other commas were given
		let { given } = writesGiven(selector, [...others, ...edgeProblems].map(({ edits, assumed, holds, sourceIndex }) => ({ edits, assumed, holds, index: sourceIndex })), opts.syntax.inlineComments(rule, opts.result), rule, opts.result, opts.checkedRuleName)

		for (let [problemIndex, { message, index, sourceIndex }] of edgeProblems.entries()) {
			report({
				message,
				node: rule,
				index: sourceIndex,
				endIndex: sourceIndex,
				result: opts.result,
				ruleName: opts.checkedRuleName,
				...(fix && given[others.length + problemIndex] && { fix: (): void => fix(rule, index, runString) }),
			})
		}

		for (let [problemIndex, { message, index, sourceIndex }] of others.entries()) {
			report({
				message,
				node: rule,
				index: sourceIndex,
				endIndex: sourceIndex,
				result: opts.result,
				ruleName: opts.checkedRuleName,
				...(fix && given[problemIndex] && { fix: (): void => fix(rule, index, runString) }),
			})
		}
	})

	/**
	 * Checks whitespace around a delimiter.
	 * @param source - The selector text the delimiter stands in.
	 * @param runString - The copy of it the runs are read over.
	 * @param index - The delimiter's index.
	 * @param node - The rule the warning is reported on.
	 * @param copies - The selector, opened by the syntax.
	 * @param textBefore - What the file holds in front of the selector, where a comma opening it has its run.
	 * @param lineCheckStr - What the list's lineness is asked of.
	 * @param wholeFix - The rule's whole fix, where the comma opens the selector and the rule may fix there.
	 * @returns The problems found, each at the delimiter's index in the selector and in the rule's source, with the spans its fix would write, or none where a guard refuses the fix.
	 */
	function checkDelimiter (source: string, runString: string, index: number, node: Rule, copies: SelectorCopies, textBefore: string, lineCheckStr: string, wholeFix?: EdgeFix): { message: string, index: number, sourceIndex: number, edits: Edit[] | undefined, assumed: Edit[] | undefined, holds: ((edited: string, move: (index: number) => number) => boolean) | undefined }[] {
		let problems: { message: string, index: number, sourceIndex: number, edits: Edit[] | undefined, assumed: Edit[] | undefined, holds: ((edited: string, move: (index: number) => number) => boolean) | undefined }[] = []

		opts.locationChecker({
			source: runString,
			index,
			textBefore,
			lineCheckStr,
			err: (message) => {
				// Asked here, not in front of the check, so a clean selector is not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, copies.comments, node, runString, wholeFix)) && !leavesTheSharedRunToTheTwin(opts.checkedRuleName, runString, index, (i) => copies.toSourceIndex(i), node, opts.result)
				let writes = isFixable ? opts.edits(source, index, node, runString, copies.toSourceIndex(index)) : undefined

				problems.push({ message, index, sourceIndex: copies.toSourceIndex(index), edits: writes?.edits, assumed: writes?.assumed, holds: isFixable ? opts.holds?.(source, index, node, runString) : undefined })
			},
		})

		return problems
	}
}
