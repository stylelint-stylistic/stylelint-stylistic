import type { Root, Rule } from "postcss"
import styleSearch from "style-search"
import type { PostcssResult } from "stylelint"

import type { SelectorCopies, Syntax } from "../../syntaxes/index.ts"
import type { InlineComment } from "../../syntaxes/index.ts"
import type { Edit } from "../applyEditsFromEnd/index.ts"
import { listLines, rawInFrontOfText } from "../rawInFrontOfText/index.ts"
import { report } from "../report/index.ts"
import { selectorSearchCopy } from "../selectorSearchCopy/index.ts"
import { textBeforeAsLeft } from "../textEdge/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"
import { writesKeepingAddresses } from "../writesKeepingAddresses/index.ts"

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
	isFixable?: ((selector: string, index: number, inlineComments: InlineComment[], rule: Rule, runString: string) => boolean),

	/** The spans a fix would write, indexed in the selector the commas are found in; the index the problem is reported at in the rule's source comes last. Every fix of a rule is asked along with the others whether the writes switch how the tokenizer reads an address's parentheses ({@link writesKeepingAddresses}), and one they refuse is reported without a fix. */
	edits: ((selector: string, index: number, rule: Rule, runString: string, sourceIndex: number) => Edit[]),
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

		let textBefore = textBeforeAsLeft(rule, rawInFrontOfText(rule), opts.result)
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

		let problems = commaIndices.flatMap((index) => checkDelimiter(selector, runString, index, rule, copies, textBefore, lineCheckStr))
		// Stylelint counts a fixer as applied whatever it does, so which fixes are given is settled before the reports, and together, since the writes of one rule are asked about as one run
		// The problems are placed at their index in the rule's source, where Stylelint reads the line a disable comment covers
		let given = writesKeepingAddresses(selector, problems.map(({ edits, sourceIndex }) => ({ edits, index: sourceIndex })), opts.syntax.inlineComments(rule, opts.result), rule, opts.result, opts.checkedRuleName)

		for (let [problemIndex, { message, index, sourceIndex }] of problems.entries()) {
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
	 * @returns The problems found, each at the delimiter's index in the selector and in the rule's source, with the spans its fix would write, or none where a guard refuses the fix.
	 */
	function checkDelimiter (source: string, runString: string, index: number, node: Rule, copies: SelectorCopies, textBefore: string, lineCheckStr: string): { message: string, index: number, sourceIndex: number, edits: Edit[] | undefined }[] {
		let problems: { message: string, index: number, sourceIndex: number, edits: Edit[] | undefined }[] = []

		opts.locationChecker({
			source: runString,
			index,
			textBefore,
			lineCheckStr,
			err: (message) => {
				// Asked here, not in front of the check, so a clean selector is not read once per comma
				let isFixable = fix && (!opts.isFixable || opts.isFixable(source, index, copies.comments, node, runString))

				problems.push({ message, index, sourceIndex: copies.toSourceIndex(index), edits: isFixable ? opts.edits(source, index, node, runString, copies.toSourceIndex(index)) : undefined })
			},
		})

		return problems
	}
}
