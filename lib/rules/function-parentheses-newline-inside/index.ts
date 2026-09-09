import type { Declaration } from "postcss"
import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback, type PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, LINE_BREAK, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { addEdit, applyEditsFromEnd, type Edit, toIndexBeforeEdits } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { splitSpaceNodesAtWords } from "../../utils/splitSpaceNodesAtWords/index.ts"

let { utils: { report, validateOptions } } = stylelint

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
 * Finds the comment spans of the value as the collected fixes leave it, in the value's own coordinates.
 *
 * A break an `always` option writes closes a `//` comment running to the end of the value, so a function behind it stops being comment text ([#288](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/288)); the parse survives, since `postcss-value-parser` knows nothing of `//` comments.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The declaration.
 * @param declValue - The value as read.
 * @param edits - The fixes collected so far.
 * @param result - The Stylelint result.
 * @returns The spans, in the coordinates of `declValue`.
 */
function findCommentSpansAfterEdits (syntax: Syntax, decl: Declaration, declValue: string, edits: Edit[], result: PostcssResult): CommentSpan[] {
	return syntax.commentSpans(applyEditsFromEnd(declValue, edits), decl, result)
		.map(({ start, end, isInline }) => ({ start: toIndexBeforeEdits(start, edits), end: toIndexBeforeEdits(end, edits), isInline }))
}

/**
 * Asks whether the function the value parser returned is one the file writes.
 *
 * No for a preprocessor construct, for an unclosed function, and for one closed on a `)` inside a `//` comment. The parser knows nothing of `//` comments: a `/*` inside one swallows every `)` behind it, and the fix grows the value by a character a run ([#131](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131)); a `)` inside one closes the call early, and the fix writes into the comment ([#320](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320)). The guards in front of the fixes miss this, since the parenthesis is inside a comment on both sides of the fix ([#132](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132)). The whole node is turned away, since the closing `)` is one the parser never returns ([#285](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/285)). PostCSS throws on a bracket the file leaves open, so only a comment unclosed a function here.
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
 * Folds lists of stretches into one ascending, non-overlapping list.
 *
 * The stretches of the two `never` fixes interleave, and {@link withoutRanges} cuts in the order given.
 * @param lists - The lists to fold, in any order.
 * @returns The one list.
 */
function mergeRanges (lists: [number, number][][]): [number, number][] {
	let merged: [number, number][] = []

	for (let [start, end] of lists.flat().toSorted(([one], [other]) => one - other)) {
		let last = merged.at(-1)

		if (last && start <= last[1]) last[1] = Math.max(last[1], end)
		else merged.push([start, end])
	}

	return merged
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
 * The span of the whitespace in front of a function's closing parenthesis.
 *
 * An unclosed function never gets here, so the node ends on the parenthesis; the closing warning is placed from the span's end too.
 * @param valueNode - The function.
 * @returns The span, in the value's coordinates.
 */
function getAfterSpan (valueNode: FunctionNode): {
	start: number,
	end: number,
} {
	let end = valueNode.sourceEndIndex - 1

	return { start: end - valueNode.after.length, end }
}

/**
 * Says which of the two `never` fixes of one function may be written.
 *
 * A fix is refused where it carries a character of the function into an inline comment: the opening one asks about the first significant thing, the closing one about the `)`. Where both pass alone, both are asked again over the union of what either empties, since two writes safe apart destroyed the value together ([#312](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312)); where the union fails, neither is written.
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
	// Each `never` fix empties the stretches its walk measured, minus one opening on the break closing an inline comment; a fix not reaching every stretch is refused, since Stylelint would call the problem solved while the option stayed violated (#285, #378).
	let emptiedBefore = checkBefore === `` ? [] : measuredBefore.filter((stretch) => !closesAnInlineComment(stretch, comments))
	let emptiedAfter = checkAfter === `` ? [] : measuredAfter.filter((stretch) => !closesAnInlineComment(stretch, comments))
	let isOpeningFixable = checkBefore !== `` && reachesEveryStretch(measuredBefore, emptiedBefore) && !movesIntoComment(syntax, declValue, firstCharacterIndex, emptiedBefore, reading)
	let isClosingFixable = checkAfter !== `` && reachesEveryStretch(measuredAfter, emptiedAfter) && !movesIntoComment(syntax, declValue, closingParenthesisIndex, emptiedAfter, reading)

	if (isOpeningFixable && isClosingFixable) {
		let emptied = mergeRanges([emptiedBefore, emptiedAfter])
		let movesTogether = movesIntoComment(syntax, declValue, firstCharacterIndex, emptied, reading) || movesIntoComment(syntax, declValue, closingParenthesisIndex, emptied, reading)

		if (movesTogether) return { isOpeningFixable: false, isClosingFixable: false }
	}

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
			// Both kinds: the value parser reads a `//` comment as nodes, and closes `/*/` on its own star (#378)
			let comments = syntax.commentSpans(declValue, decl, result)
			// A break this rule writes closes an open `//` comment, so the spans are found again before the next function
			let areSpansStale = false
			// Quotation marks a comment leaves open are masked so the parser pairs them as the file does (#508)
			let parsedValue = valueParser(hideQuotesInComments(declValue, comments))

			// The value parser calls a vertical tab whitespace where the tokenizer calls it a word
			splitSpaceNodesAtWords(parsedValue.nodes)

			parsedValue.walk((valueNode, at, siblings) => {
				if (valueNode.type !== `function`) return

				// A call opening an address holds no arguments of the value: what stands inside is the address, and a space or a break written behind the `(` parts it from the parenthesis, which is what a tokenizer reads one token by ([#533](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/533)). Passed over whole, and the walk goes no further in, as it does in the four rules that ask this question of a node they would otherwise read inside; the two utilities asking it walk on, having nothing to say about what an address holds. The name is the file's spelling rather than the parser's, which is wider than what a parser takes a url token by ([#669](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/669)).
				if (opensAnAddress(valueNode, at, siblings)) return false

				if (areSpansStale) {
					comments = findCommentSpansAfterEdits(syntax, decl, declValue, edits, result)
					areSpansStale = false
				}

				// A call in a comment's text is skipped, but its nested calls are walked: a call opened inside a comment reaches past its close
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// Both sides are read first: under `never-multi-line` the two fixes are weighed against one another
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex, measured: measuredBefore } = getCheckBefore(valueNode, openingIndex, declValue, comments)
				// From the node's end, not a printed copy, which the stringifier widens at `/*/` (#506)
				let closingIndex = getAfterSpan(valueNode).end - 1
				let { after: checkAfter, measured: measuredAfter } = getCheckAfter(valueNode, declValue, comments)
				let { isOpeningFixable, isClosingFixable } = isMultiLine && primary === `never-multi-line`
					? getNeverFixability(syntax, { declValue, valueNode, checkBefore, checkAfter, firstIndex, measuredBefore, measuredAfter, comments, reading })
					: { isOpeningFixable: false, isClosingFixable: false }

				// Check opening ...
				if (primary === `always` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(measuredBefore, declValue, getLineBreak(syntax, root, result)))
					complain(messages.expectedOpening, openingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(measuredBefore, declValue, getLineBreak(syntax, root, result)))
					complain(messages.expectedOpeningMultiLine, openingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
					fix = isOpeningFixable ? fixWith(() => fixBeforeForNever(measuredBefore)) : undefined
					complain(messages.rejectedOpeningMultiLine, openingIndex)
				}

				// A pair holding no node encloses one run of whitespace, which the parser hands back whole as `before` and never as `after`, so the closing question is the opening one, already asked: asking it again reported a half the opening fix had settled and wrote another break every run ([#329](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/329)). `splitSpaceNodesAtWords` has run, so a node here means the tokenizer's whitespace; under `never-multi-line` the closing check was dead on such a pair already, `checkAfter` being empty.
				if (valueNode.nodes.length === 0) return

				// Check closing ...
				if (primary === `always` && !LINE_BREAK.test(checkAfter)) {
					fix = fixWith(() => fixAfterForAlways(valueNode, getLineBreak(syntax, root, result)))
					complain(messages.expectedClosing, closingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkAfter)) {
					fix = fixWith(() => fixAfterForAlways(valueNode, getLineBreak(syntax, root, result)))
					complain(messages.expectedClosingMultiLine, closingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkAfter !== ``) {
					fix = isClosingFixable ? fixWith(() => fixAfterForNever(measuredAfter)) : undefined
					complain(messages.rejectedClosingMultiLine, closingIndex)
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

					areSpansStale = true
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
 * Reads the whitespace before the first significant node of a function, and where that node begins.
 *
 * A comment between the `(` and the break is walked past and the whitespace behind it counted; nodes are placed against the comment spans, since the value parser reads a `//` comment as nodes. In a function of comments and whitespace alone the first significant thing is its closing `)`. The stretches come back for the `never` guard.
 * @param valueNode - The function.
 * @param openingIndex - Where the text behind the `(` begins.
 * @param declValue - The value the positions count in.
 * @param comments - The comment spans of the value, both kinds.
 * @returns The whitespace, where the first significant thing begins, and the stretches measured.
 */
function getCheckBefore (valueNode: FunctionNode, openingIndex: number, declValue: string, comments: CommentSpan[]): {
	before: string,
	firstIndex: number,
	measured: [number, number][],
} {
	let before = valueNode.before
	let measured: [number, number][] = [[openingIndex, openingIndex + valueNode.before.length]]
	let firstIndex = valueNode.sourceEndIndex - 1

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		let span = findCommentSpanHolding(node, comments)

		if (span) {
			// A node held by a comment can reach past the span's end, with whitespace the parser hangs behind a `/`, `:` or `,`, or with code read across the break; only the whitespace at the front of the overrun is the value's (#303). A run rather than one break, since the indentation of the next line is the value's too.
			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				before += whitespace
				measured.push([span.end, span.end + whitespace.length])

				// Code behind that whitespace is the first significant thing, whatever node it is filed under
				if (whitespace.length !== overrun.length) {
					firstIndex = span.end + whitespace.length
					break
				}
			}

			continue
		}

		if (node.type === `space`) {
			before += node.value
			measured.push([node.sourceIndex, node.sourceEndIndex])
			continue
		}

		if (node.type === `div`) {
			// The parser hangs the whitespace in front of a `/`, `:` or `,` on the node, so a div opens in front of its own text: the first slash of a `//` comment standing behind another comment opens one whose `sourceIndex` is the run in front of the span ([#505](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/505)). That run is the value's, and the comment is walked past like any other. The run is whitespace to the parser and a span opens on a `/`, so the span opens where the div's text does.
			let textSpan = findCommentSpanAt(node.sourceIndex + node.before.length, comments)

			if (textSpan) {
				// The parser calls every character below the space whitespace where the tokenizer calls most of them words, and `splitSpaceNodesAtWords` rewrites the space nodes alone, never a div's own run (#496)
				let whitespace = (node.before.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				before += whitespace
				measured.push([node.sourceIndex, node.sourceIndex + whitespace.length])

				// A word behind that whitespace is the first significant thing, as it is behind the whitespace a node overruns its comment with
				if (whitespace.length !== node.before.length) {
					firstIndex = node.sourceIndex + whitespace.length
					break
				}

				continue
			}
		}

		firstIndex = node.sourceIndex
		break
	}

	return { before, firstIndex, measured }
}

/**
 * Reads the whitespace in front of a function's closing `)`: the node's `after` and every whitespace node behind the last significant one.
 *
 * The mirror of {@link getCheckBefore}: a node held by a block comment is read the same way, since the closing slash of `/*\/` is a division sign to the parser and the whitespace behind it is the value's ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)). An inline comment ends the walk, since no fix may take the break closing it. The stretches come back for the `never` fix.
 *
 * A div opening in front of its own text is asked nothing here ([#505](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/505)): the run the parser hung on it stands in front of the comment rather than beside the `)`, and the only span that opens where such a div's text does is an inline comment's, which ends this walk exactly as an unplaced div does.
 * @param valueNode - The function.
 * @param declValue - The value the positions count in.
 * @param comments - The comment spans of the value, both kinds.
 * @returns The whitespace and the stretches measured, in value order.
 */
function getCheckAfter (valueNode: FunctionNode, declValue: string, comments: CommentSpan[]): {
	after: string,
	measured: [number, number][],
} {
	let after = valueNode.after
	let { start, end } = getAfterSpan(valueNode)
	let measured: [number, number][] = [[start, end]]

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		let span = findCommentSpanHolding(node, comments)

		if (span) {
			if (span.isInline) break

			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				after = whitespace + after
				measured.unshift([node.sourceEndIndex - whitespace.length, node.sourceEndIndex])

				if (whitespace.length !== overrun.length) break
			}

			continue
		}

		if (node.type === `space`) {
			after = node.value + after
			measured.unshift([node.sourceIndex, node.sourceEndIndex])

			continue
		}

		break
	}

	return { after, measured }
}

/**
 * Names the span the `always` fix writes the break into: the last stretch the walk measured, so a comment in between keeps its line.
 *
 * That stretch may be whitespace a node held by a comment reaches past the comment with; a walk by whitespace nodes wrote the break at the `(` ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)). The stretch behind an inline comment opens on the break closing it, so it is never the last.
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
