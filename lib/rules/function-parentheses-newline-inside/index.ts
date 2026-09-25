import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_CSS_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { addEdit, applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { breakRereadsParentheses } from "../../utils/breakRereadsParentheses/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editsOpenNoComment } from "../../utils/editsOpenNoComment/index.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getAfterSpan, readClosingRuns, readOpeningRuns } from "../../utils/functionParenthesesRuns/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideParenthesesInUrlStrings } from "../../utils/hideParenthesesInUrlStrings/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { isCustomProperty } from "../../utils/isCustomProperty/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import { quotesItsAddress } from "../../utils/quotesItsAddress/index.ts"
import { report } from "../../utils/report/index.ts"
import { editsRereadAnAddress } from "../../utils/rereadsAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { splitSpaceNodesAtWords } from "../../utils/splitSpaceNodesAtWords/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `function-parentheses-newline-inside`

const MESSAGES = defineMessages({
	expectedOpening: `Expected newline after "("`,
	expectedClosing: `Expected newline before ")"`,
	expectedOpeningMultiLine: `Expected newline after "(" in a multi-line function`,
	rejectedOpeningMultiLine: `Unexpected whitespace after "(" in a multi-line function`,
	expectedClosingMultiLine: `Expected newline before ")" in a multi-line function`,
	rejectedClosingMultiLine: `Unexpected whitespace before ")" in a multi-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether the function the value parser returned is one the file writes.
 *
 * No for a preprocessor construct, for an unclosed function, and for one closed on a `)` inside a `//` comment. The parser knows nothing of `//` comments: a `/*` inside one swallows every `)` behind it, and the fix grows the value by a character a run; a `)` inside one closes the call early, and the fix writes into the comment. The guards in front of the fixes miss this, since the parenthesis is inside a comment on both sides of the fix. The whole node is turned away, since the closing `)` is one the parser never returns. PostCSS throws on a bracket the file leaves open, so only a comment unclosed a function here.
 * @param syntax - The syntax the rule is built over.
 * @param valueNode - The function the walk has reached.
 * @param comments - The comment spans of the value, both kinds.
 * @returns True where the rule may read and write the parentheses.
 */
function isFunctionParsedAsWritten (syntax: Syntax, valueNode: FunctionNode, comments: CommentSpan[]): boolean {
	if (!syntax.isStandardFunction(valueNode)) return false

	if (valueNode.unclosed) return false

	// After `unclosed`: an unclosed node's end index is not its own, or one past the text
	return !findCommentSpanAt(valueNode.sourceEndIndex - 1, comments)
}

/**
 * Cuts the stretches out of a text.
 * @param text - The value the stretches are cut from.
 * @param ranges - The stretches, ascending and non-overlapping.
 * @returns The rest.
 */
function withoutRanges (text: string, ranges: [number, number][]): string {
	let kept = ``
	let index = 0

	for (let [start, end] of ranges) {
		kept += text.slice(index, start)
		index = end
	}

	return kept + text.slice(index)
}

/**
 * Asks whether a whitespace stretch opens on the break closing an inline comment, which no fix may take.
 * @param stretch - The start and end of the whitespace run.
 * @param comments - The comment spans of the value, both kinds.
 * @returns True where the stretch begins where an inline comment ends.
 */
function closesAnInlineComment (stretch: [number, number], comments: CommentSpan[]): boolean {
	let [start] = stretch

	return comments.some(({ end, isInline }) => isInline && end === start)
}

/**
 * Asks whether the fix empties every stretch the walk measured.
 * @param measured - The stretches the walk measured.
 * @param emptied - The stretches the fix empties.
 * @returns True where every measured stretch lies inside an emptied one.
 */
function reachesEveryStretch (measured: [number, number][], emptied: [number, number][]): boolean {
	return measured.every(([start, end]) => emptied.some(([from, to]) => from <= start && to >= end))
}

/**
 * Asks whether the fixes would take a character of a function from outside an inline comment into one.
 *
 * The text is read as the fixes leave it, since closing a gap can bring two slashes together. Only the emptied stretches come out: taking out every JavaScript whitespace closed a block comment early.
 * @param syntax - The syntax the rule is built over.
 * @param declValue - The value the positions count in.
 * @param characterIndex - Where the character stands.
 * @param emptied - The stretches the fixes empty, ascending and non-overlapping.
 * @param reading - What the syntax makes of a `//` comment.
 * @returns True where the character moves into a comment.
 */
function movesIntoComment (syntax: Syntax, declValue: string, characterIndex: number, emptied: [number, number][], reading: InlineCommentReading): boolean {
	let standingText = declValue.slice(0, characterIndex + 1)

	return syntax.movesEndIntoInlineComment(standingText, withoutRanges(standingText, emptied), reading)
}

/**
 * Where the first significant node of a function stops being whitespace.
 *
 * The value parser hangs the whitespace before a `/`, `:` or `,` on the node, so the node may begin in whitespace.
 * @param declValue - The value the positions count in.
 * @param firstIndex - Where the first significant node begins.
 * @returns The index of that character.
 */
function findFirstCharacterIndex (declValue: string, firstIndex: number): number {
	// The run may be empty, so the pattern matches every text
	return firstIndex + (declValue.slice(firstIndex).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length
}

/**
 * Says which of the two `never` fixes of one function may be written.
 *
 * A fix is refused where it carries a character of the function into an inline comment: the opening one asks about the first significant thing, the closing one about the `)`. Under a parser whose tokenizer reads the parentheses behind `url(` as one token, the opening one is refused too where it opens a comment, as taking away the whitespace in front of a quotation mark there does, and under either tokenizer where emptying the run switches how it reads parentheses it takes for an address's. The two are not weighed together: two writes safe apart destroyed the value together only where a call was opened inside a `//` comment, and the walk turns such a call away before either is asked.
 * @param syntax - The syntax the rule is built over.
 * @param read - What the walk read of the function, and the value.
 * @returns Whether each fix may be written.
 */
function getNeverFixability (syntax: Syntax, read: {
	declValue: string,
	valueNode: FunctionNode,
	checkBefore: string,
	checkAfter: string,
	firstIndex: number,
	measuredBefore: [number, number][],
	measuredAfter: [number, number][],
	comments: CommentSpan[],
	reading: InlineCommentReading,
}): {
	isOpeningFixable: boolean,
	isClosingFixable: boolean,
} {
	let { declValue, valueNode, checkBefore, checkAfter, firstIndex, measuredBefore, measuredAfter, comments, reading } = read

	let firstCharacterIndex = findFirstCharacterIndex(declValue, firstIndex)
	let { end: closingParenthesisIndex } = getAfterSpan(valueNode)
	// Each `never` fix empties the stretches its walk measured, minus one opening on the break closing an inline comment; a fix not reaching every stretch is refused, since Stylelint would call the problem solved while the option stayed violated.
	let emptiedBefore = checkBefore === `` ? [] : measuredBefore.filter((stretch) => !closesAnInlineComment(stretch, comments))
	let emptiedAfter = checkAfter === `` ? [] : measuredAfter.filter((stretch) => !closesAnInlineComment(stretch, comments))
	let isOpeningFixable = checkBefore !== `` && reachesEveryStretch(measuredBefore, emptiedBefore) && !movesIntoComment(syntax, declValue, firstCharacterIndex, emptiedBefore, reading) && (!reading.tokenizes || editsOpenNoComment(declValue, fixBeforeForNever(emptiedBefore), reading)) && !editsRereadAnAddress(declValue, valueNode.sourceIndex + valueNode.value.length, fixBeforeForNever(emptiedBefore), reading)
	let isClosingFixable = checkAfter !== `` && reachesEveryStretch(measuredAfter, emptiedAfter) && !movesIntoComment(syntax, declValue, closingParenthesisIndex, emptiedAfter, reading)

	return { isOpeningFixable, isClosingFixable }
}

/** `always` a newline inside the parentheses; `always-multi-line` asks it, and `never-multi-line` refuses whitespace there, in a multi-line function only. */
export type PrimaryOption = `always` | `always-multi-line` | `never-multi-line`

/**
 * Requires a newline or disallows whitespace on the inside of the parentheses of functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let fix: FixCallback | undefined
			// Edited by position, not printed from the parsed tree: `postcss-value-parser` prints a comment opening `/*/` as `/**/`
			let edits: Edit[] = []
			let declValue = syntax.read(decl)
			// A `//` is a comment only where the syntax says so: in plain CSS `myurl(//a)` is code
			let reading = syntax.inlineComments(decl, result)
			// Both kinds: the value parser reads a `//` comment as nodes, and closes `/*/` on its own star
			let comments = syntax.commentSpans(declValue, decl, result)
			// Quotation marks a comment leaves open are masked so the parser pairs them as the file does
			let parsedValue = valueParser(hideParenthesesInUrlStrings(hideQuotesInComments(declValue, comments), comments))

			// The value parser calls a vertical tab whitespace where the tokenizer calls it a word
			splitSpaceNodesAtWords(parsedValue.nodes)

			parsedValue.walk((valueNode, at, siblings) => {
				if (valueNode.type !== `function`) return

				// A narrowing here is not carried into a nested function
				let functionNode = valueNode

				// The parentheses of a bare address are the address's: a space or a break written behind the `(` parts it from the parenthesis, which is what a tokenizer reads one token by, so the call is passed over and the walk goes no further in. A quoted address's parentheses are the call's own and are checked like any call's, the write behind the `(` asking below whether it switches how the tokenizer reads them, since `postcss-scss` reads a quoted address behind a space as a token counting parentheses, which a string holding an unpaired one leaves unclosed or closes early. The name is the file's spelling rather than the parser's, which is wider than what a parser takes a url token by.
				if (opensAnAddress(valueNode, at, siblings) && !quotesItsAddress(valueNode)) return false

				// A call in a comment's text is skipped, but its nested calls are walked: a call opened inside a comment reaches past its close
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// Both sides are read first: under `never-multi-line` the two fixes are weighed against one another
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex, measured: measuredBefore } = readOpeningRuns(valueNode, openingIndex, declValue, comments)
				// From the node's end, not a printed copy, which the stringifier widens at `/*/`
				let closingIndex = getAfterSpan(valueNode).end - 1
				let { after: checkAfter, measured: measuredAfter } = readClosingRuns(valueNode, declValue, comments)
				let { isOpeningFixable, isClosingFixable } = isMultiLine && primary === `never-multi-line`
					? getNeverFixability(syntax, { declValue, valueNode, checkBefore, checkAfter, firstIndex, measuredBefore, measuredAfter, comments, reading })
					: { isOpeningFixable: false, isClosingFixable: false }
				// A break written into parentheses PostCSS holds as one token makes them code, and a `[` inside, or a `{` in a custom property's value, is then a group nothing closes: the file stops parsing, so the `always` fixes are refused there and the warnings stand; a multi-line call holds a break inside its parentheses already, so `always-multi-line` never meets the token
				let breaksAToken = breakRereadsParentheses(declValue, openingIndex - 1, isCustomProperty(decl.prop))
				// The break the `always` options write behind the `(` stands where the tokenizer decides whether parentheses it takes for an address's are one token, and the name it reads there is not the one the walk read; the break in front of the `)` moves no such character, so only this one is asked about. Read under those two options alone: `fixBeforeForAlways` takes the last stretch the walk measured, and `never-multi-line` is the option that can meet a call with none.
				let writesABreakBehind = primary === `always` || primary === `always-multi-line`
				let openingWrite = writesABreakBehind ? fixBeforeForAlways(measuredBefore, declValue, getLineBreak(root, result)) : []
				let alwaysRereadsAnAddress = writesABreakBehind && editsRereadAnAddress(declValue, openingIndex - 1, openingWrite, reading)

				checkOpening()

				// A pair holding no node encloses one run of whitespace, which the parser hands back whole as `before` and never as `after`, so the closing question is the opening one, already asked: asking it again reported a half the opening fix had settled and wrote another break every run. `splitSpaceNodesAtWords` has run, so a node here means the tokenizer's whitespace; under `never-multi-line` the closing check was dead on such a pair already, `checkAfter` being empty.
				if (valueNode.nodes.length === 0) return

				checkClosing()

				/** Reports the whitespace behind the `(`, fixing it where no guard refuses the write. */
				function checkOpening (): void {
					if (primary === `always` && !LINE_BREAK.test(checkBefore)) {
						fix = !breaksAToken && !alwaysRereadsAnAddress ? fixWith(() => openingWrite) : undefined
						complain(messages.expectedOpening, openingIndex)
					}

					if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkBefore)) {
						fix = alwaysRereadsAnAddress ? undefined : fixWith(() => openingWrite)
						complain(messages.expectedOpeningMultiLine, openingIndex)
					}

					if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
						fix = isOpeningFixable ? fixWith(() => fixBeforeForNever(measuredBefore)) : undefined
						complain(messages.rejectedOpeningMultiLine, openingIndex)
					}
				}

				/** Reports the whitespace in front of the `)`; every closing fix writes the `after` span. */
				function checkClosing (): void {
					if (primary === `always` && !LINE_BREAK.test(checkAfter)) {
						fix = breaksAToken ? undefined : fixWith(() => fixAfterForAlways(functionNode, getLineBreak(root, result)))
						complain(messages.expectedClosing, closingIndex)
					}

					if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkAfter)) {
						fix = fixWith(() => fixAfterForAlways(functionNode, getLineBreak(root, result)))
						complain(messages.expectedClosingMultiLine, closingIndex)
					}

					if (isMultiLine && primary === `never-multi-line` && checkAfter !== ``) {
						fix = isClosingFixable ? fixWith(() => fixAfterForNever(measuredAfter)) : undefined
						complain(messages.rejectedClosingMultiLine, closingIndex)
					}
				}
			})

			if (edits.length > 0) syntax.write(decl, applyEditsFromEnd(declValue, edits))

			/**
			 * Wraps a write as a fix for `report` that adds its spans to the edit list.
			 *
			 * Two writes can name one span, as the `never-multi-line` fixes do over the whitespace between two comments, which both walks measure; `addEdit` folds the second into the first.
			 * @param write - The spans the write changes, and what goes in each.
			 * @returns The fix.
			 */
			function fixWith (write: () => Edit[]): () => void {
				return () => {
					for (let edit of write()) addEdit(edits, edit)
				}
			}

			/**
			 * Reports a violation.
			 * @param message - The warning text to report.
			 * @param offset - The index in the value.
			 */
			function complain (message: string, offset: number): void {
				let problemIndex = declarationValueIndex(decl) + offset

				report({
					ruleName,
					result,
					message,
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
					...(fix && { fix }),
				})
			}
		})
	}
}

/**
 * Names the span the `always` fix writes the break into: the last stretch the walk measured, so a comment in between keeps its line.
 *
 * That stretch may be whitespace a node held by a comment reaches past the comment with; a walk by whitespace nodes wrote the break at the `(`. The stretch behind an inline comment opens on the break closing it, so it is never the last.
 * @param measured - The stretches the walk measured behind the `(`, in order.
 * @param declValue - The value the stretches count in.
 * @param newline - The newline to write.
 * @returns The edit.
 */
function fixBeforeForAlways (measured: [number, number][], declValue: string, newline: string): Edit[] {
	let [start, end] = measured.at(-1) as [number, number]

	return [{ start, end, text: newline + declValue.slice(start, end) }]
}

/**
 * Names the spans the `never` fix empties before the first node: the stretches the guard weighed.
 * @param measured - The stretches the walk measured behind the `(`.
 * @returns The edits.
 */
function fixBeforeForNever (measured: [number, number][]): Edit[] {
	return measured.map(([start, end]) => ({ start, end, text: `` }))
}

/**
 * Names the span the `always` fix writes a break into before the closing `)`.
 * @param valueNode - The function.
 * @param newline - The newline to write.
 * @returns The edits.
 */
function fixAfterForAlways (valueNode: FunctionNode, newline: string): Edit[] {
	let { start, end } = getAfterSpan(valueNode)

	return [{ start, end, text: newline + valueNode.after }]
}

/**
 * Names the spans the `never` fix empties before the closing `)`: the stretches the guard weighed.
 * @param measured - The stretches the walk measured in front of the `)`.
 * @returns The edits.
 */
function fixAfterForNever (measured: [number, number][]): Edit[] {
	return measured.map(([start, end]) => ({ start, end, text: `` }))
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
