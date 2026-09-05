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
 * Finds the spans the comments of a value occupy once the fixes collected so far are written into it, counted in the value as the file spells it.
 *
 * A comment opened by a double slash is closed by the first line break behind it, and the `always` options of this rule write line breaks. So a fix closes such a comment wherever the file left it running to the end of the value, and everything the comment used to hold behind that break is code of the value from then on — a function among it. Read against the spans the value had before that fix, such a function is passed over as a comment's text, and the problem it has waits for the next run (#288).
 *
 * The spans are placed back in the coordinates of the value the file spells, since that is what the nodes of the parse are counted in — and the parse itself survives every one of these fixes untouched, `postcss-value-parser` knowing nothing of a comment opened by a double slash and reading its text as ordinary nodes whether it is closed early or not. The block comments come along, since the walk asks about every comment in one list: a break written into a value closes none of them, so they are found again where they were.
 * @param syntax - The syntax the rule is built over, which says where the comments of a text stand.
 * @param decl - The declaration the value belongs to.
 * @param declValue - The value the rule has read and parsed.
 * @param edits - The fixes collected so far, each one a span of that value.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The spans, in the coordinates of the value the file spells.
 */
function findCommentSpansAfterEdits (syntax: Syntax, decl: Declaration, declValue: string, edits: Edit[], result: PostcssResult): CommentSpan[] {
	return syntax.commentSpans(applyEditsFromEnd(declValue, edits), decl, result)
		.map(({ start, end, isInline }) => ({ start: toIndexBeforeEdits(start, edits), end: toIndexBeforeEdits(end, edits), isInline }))
}

/**
 * Asks whether the file spells the function the value parser has handed back.
 *
 * A preprocessor construct is none, and neither is a function the parser has marked unclosed. The parser knows nothing of a comment opened by a double slash, so a `/*` standing in the text of one opens a block comment to it that never closes and swallows the closing parenthesis of every function open around it. The stringifier then prints what such a node keeps in front of its parenthesis behind it instead, so the whitespace an `always` option asks for there lands outside the function; PostCSS trims that whitespace out of the value and into the raws of what follows, which leaves the value looking untouched to the next run, and the next run writes another one — a character a run, for as long as the fixer is asked (#131).
 *
 * A function the parser closed on a parenthesis standing inside such a comment is none the file spells either, and is the third question. The parser closes a call on the first parenthesis it meets, and the text of a comment is text it reads as code, so `f(1px // c) h(2px` and a break and `2px)` — one call of `f` reaching over that break, as every syntax spelling such a comment reads it — comes back as a closed `f(1px // c)` with an `h(2px` and the break and `2px)` beside it. Neither parenthesis the parser gives that `f` is one the file writes, and the break an `always` option asks for in front of the second closes the comment and turns everything the comment held behind that break into code: `foo(1px // c) calc(` and a break and `2px)`, which Less reads as `foo(1px 2px)`, came back as two calls (#320).
 *
 * The two guards standing in front of the fixes answer nothing here. They ask whether a fix would take something from outside a comment into one, and this parenthesis is inside one on both sides of the fix — which #132 lets through on purpose, a value already broken that way being one the fix leaves no worse. That reasoning holds for a parenthesis the file really spells and not for one the parser invented.
 *
 * Half the node is no answer, though the halves are not alike. The opening parenthesis of such a call is one the file really writes, and so is the whitespace behind it, so the opening half of an option could be read and fixed where it stands. The closing half could not: the parenthesis the file closes the call on is one the parser never hands over, so whether the option is satisfied there is a question the rule cannot put at all. Sometimes it already is — the last parenthesis of `f(1px // c) h(2px`, a break, `2px` and a break and `)` has the break an `always` option wants in front of it, the file reading `f(1px`, the break, `2px`, the break and `)` — and sometimes it is not, as in the same value without that second break. A rule keeping the opening half would write its whitespace and report the problem solved in both, and in the second it would hand back a value still violating the option at a parenthesis no run can ever reach, which is the shape #285 is about. Nothing the rule can see tells the two apart, so reporting nothing is the honest answer, and the warnings that costs are the price of a parse it cannot mend.
 *
 * The whole node is turned away rather than the closing half of it, warning and all: the parentheses the options are about are not where the parser puts them, and nothing read out of a value the parser has misread this way is worth reporting. A closed call standing inside such a function is reached by the walk as ever, and read and fixed where it stands. A bracket the file really leaves open never gets here — PostCSS throws on one of those before any rule sees the declaration — so a comment is the only thing the second question turns away.
 * @param syntax - The syntax the rule is built over.
 * @param valueNode - The function the walk has reached.
 * @param comments - The spans the comments of the value occupy in it, both kinds.
 * @returns True where the rule may read the function's parentheses and write between them.
 */
function isFunctionParsedAsWritten (syntax: Syntax, valueNode: FunctionNode, comments: CommentSpan[]): boolean {
	if (!syntax.isStandardFunction(valueNode)) return false

	if (valueNode.unclosed) return false

	// The parenthesis the node ends on, asked after `unclosed` because a node marked so ends on no parenthesis of its own while the index still lands on a character: `f(1px // /*` and ` c`, a break and `2px)` ends on a parenthesis standing outside every comment, and `f("abc)` ends one character past the text altogether
	return !findCommentSpanAt(valueNode.sourceEndIndex - 1, comments)
}

/**
 * Takes the given stretches out of a text.
 * @param text - The text to cut.
 * @param ranges - The stretches to take out, in ascending order and none of them overlapping.
 * @returns What is left once they are gone.
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
 * Folds lists of stretches into one list, in ascending order and with none of them overlapping.
 *
 * The stretches the two `never` fixes of one function empty interleave rather than following one another, and the two can name one and the same stretch: a call holding nothing but comments has every whitespace node it holds emptied by the walk out from the opening parenthesis and by the walk back from the closing one alike. {@link withoutRanges} reads its list in the order it is given, cutting the text once at each stretch, so two lists written one behind the other would have it cutting backwards the moment such a call holds a third comment.
 * @param lists - The lists to fold, in whatever order each of them holds its stretches.
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
 * Asks whether a stretch of whitespace opens on the break that closes an inline comment, which no fix may take away.
 * @param stretch - The stretch, as the walk measured it.
 * @param comments - The spans the comments of the value occupy in it, both kinds.
 * @returns True where the stretch begins where an inline comment ends.
 */
function closesAnInlineComment (stretch: [number, number], comments: CommentSpan[]): boolean {
	let [start] = stretch

	return comments.some(({ end, isInline }) => isInline && end === start)
}

/**
 * Asks whether a fix reaches every stretch a walk measured, so that what the option asks for and what the fix would write are one and the same.
 * @param measured - The stretches the walk measured.
 * @param emptied - The stretches the fix empties.
 * @returns True where every measured stretch lies inside one the fix empties.
 */
function reachesEveryStretch (measured: [number, number][], emptied: [number, number][]): boolean {
	return measured.every(([start, end]) => emptied.some(([from, to]) => from <= start && to >= end))
}

/**
 * Asks whether the fixes would take a character of a function from outside an inline comment into one.
 *
 * The text the character ends is cut out of the value, and what the fixes would leave of it is spelled out rather than measured: closing a gap up can bring a slash against a comment's own and open a comment that was never there. What they would leave behind is the stretches they empty and nothing besides — taking out more than that, every character JavaScript calls whitespace between the last node and the parenthesis, which is what the closing guard used to do, closes a block comment early wherever a break is written inside its own text and holds back a fix nothing is at risk from.
 *
 * The two separators of Unicode need no reading of their own. A fix here writes over whitespace, and the value parser counts as space only what stands below the blank, so a separator survives every fix this guard stands in front of — whatever a reading makes of it, it makes the same of it before the fix and after, and it can never be what carries a parenthesis or an argument into a comment.
 * @param syntax - The syntax the rule is built over.
 * @param declValue - The value the rule has read and parsed, which the positions count in.
 * @param characterIndex - Where the character the question is about stands.
 * @param emptied - The stretches the fixes empty, in ascending order and none of them overlapping.
 * @param reading - What the syntax the value was spelled in makes of a comment opened by a double slash.
 * @returns True where a reading has the character move into a comment.
 */
function movesIntoComment (syntax: Syntax, declValue: string, characterIndex: number, emptied: [number, number][], reading: InlineCommentReading): boolean {
	let standingText = declValue.slice(0, characterIndex + 1)

	return syntax.movesEndIntoInlineComment(standingText, withoutRanges(standingText, emptied), reading)
}

/**
 * Where the first significant node of a function first spells something other than whitespace.
 *
 * The value parser hangs the whitespace in front of a division sign, a colon and a comma on the node itself rather than emitting a node of its own for it, so such a node may begin in whitespace, and a text cut off at its beginning would be read with that whitespace trimmed away — the break closing a comment among it.
 * @param declValue - The value the rule has read and parsed, which the positions count in.
 * @param firstIndex - Where the first significant node of the function begins.
 * @returns Where that character stands.
 */
function findFirstCharacterIndex (declValue: string, firstIndex: number): number {
	// The run may be empty, so the pattern matches every text
	return firstIndex + (declValue.slice(firstIndex).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length
}

/**
 * Names the span the whitespace in front of a function's closing parenthesis stands in.
 *
 * A function the parser has marked unclosed never gets here, so the parenthesis is the character the node ends on. The closing warning is counted from the span's end as well, one character in front of it, so that the warning and the fixes name one parenthesis.
 * @param valueNode - The function being read.
 * @returns The span, counted in the value the file spells.
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
 * The two are written in one pass over one value, and each of them is guarded by the question whether it would carry a character of the function into an inline comment: the opening one asks about the first significant thing the function holds, the closing one about the parenthesis itself. A function holding nothing but comments and whitespace has no significant node at all, so the first question is about that same parenthesis, and both fixes empty whitespace standing in front of it.
 *
 * Each fix has to be safe on its own, and the two have to be safe together. A fix that is not safe on its own is never written, and the other is then asked about the value as it alone would leave it: weighing it against a stretch nothing empties would decline a fix nothing is at risk from. Where both are safe on their own, the two questions are put again over the union of what either empties, since that union is the text the pass really leaves behind — putting them over two texts, each of which still holds the other fix's whitespace, is what let two writes safe apart destroy the value together (#312). Neither is written where that union carries a character into a comment: both problems are reported and nothing goes into the file.
 * @param syntax - The syntax the rule is built over.
 * @param read - What the walk has read of the function, and the value it was read from.
 * @returns Whether each of the two fixes may be written.
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
	// Each `never` fix empties the very stretches its walk measured, so that what the option asks for and what the fix reaches are one list read twice — all but a stretch standing behind an inline comment, which opens on the break that closes the comment and which no fix may take away. Where a walk measured such a stretch the fix does not reach it, the option cannot be satisfied by what the fix would write, and nothing is written: what the fix did not reach would stay, the option would stay violated, and Stylelint would call the problem solved and hand the next run the same one (#285). Each side used to be two walks, and the fix's stopped at the first node it could not name: the first slash an inline comment is spelled with, which is the shape above, and the word and the div the parser files the closing star and slash of a comment opening `/*/` under, the whitespace behind them hung on the div rather than filed as a node of its own — so with the spans widened to both kinds the fix would not have reached the whitespace the walk measured behind such a comment, and would have refused to write wherever a block comment's text stood beside the argument, while the base, asking about the inline spans alone, measured nothing there and emptied the space inside the comment (#378). The safety question is put over the list the fix empties, which is the honest set to ask about.
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

/**
 * Requires a newline or disallows whitespace on the inside of the parentheses of functions.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `always-multi-line` and `never-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line` | `never-multi-line`, _secondaryOptions: unknown): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let fix: FixCallback | undefined
			// What a fix changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
			let edits: Edit[] = []
			let declValue = syntax.read(decl)
			// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
			let reading = syntax.inlineComments(decl, result)
			// Every comment the value holds, both kinds. A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind, so what such a comment holds comes back as ordinary nodes; a block comment reaches the walk as a node of its own — except one opening `/*/`, which the parser closes on the star it opened with, handing the rest of its text back the same way (#378)
			let comments = syntax.commentSpans(declValue, decl, result)
			// A break this rule writes closes such a comment where the file left one open, so the spans above describe a value the functions behind that write no longer stand in. They are found again before the next function is read, and only there: a value nothing has been written into holds the comments it was scanned for, and a run without `--fix` writes nothing at all.
			let areSpansStale = false
			// The value is parsed in a copy of itself with every quotation mark its comments leave open masked, so that the parser pairs the marks the value spells the way the file pairs them (#508)
			let parsedValue = valueParser(hideQuotesInComments(declValue, comments))

			// The value parser calls a vertical tab whitespace where the tokenizer calls it a word, and every walk below reads runs by the parser's nodes
			splitSpaceNodesAtWords(parsedValue.nodes)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				if (areSpansStale) {
					comments = findCommentSpansAfterEdits(syntax, decl, declValue, edits, result)
					areSpansStale = false
				}

				// A call standing in the text of a comment is no call of the value, and its parentheses are none of this rule's: leave it alone. A call nested inside it is still walked and asked the same question, since one opened inside such a comment reaches past the break or the delimiter that closes it and gathers code the file spells.
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// What the walk reads of the function ... Both sides of it are read before either is reported on: under `never-multi-line` the two fixes are weighed against one another, so neither can be handed to a warning before the other has been weighed.
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex, measured: measuredBefore } = getCheckBefore(valueNode, openingIndex, declValue, comments)
				// The character in front of the parenthesis the closing fixes write at, counted where the parser marks the node's end in the file: the length of a printed copy of the node is no measure of it, since the stringifier gives a comment opening `/*/` back as `/**/`, a character wider than the file spells it, and an index counted from that length landed on the parenthesis itself (#506)
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
			 * Hands `report` a fix that adds the spans a write changes to the list the value is edited by.
			 *
			 * Two writes of this rule can name one and the same span. An empty function is one: everything such a call holds between its parentheses is whitespace the parser hands back as `before`, so the span in front of the closing parenthesis is the same empty span as the one behind the opening one, and both halves of an `always` option ask for a break there. A whitespace node standing between two comments is another: under `never-multi-line` the walk out from the opening parenthesis empties it, and the walk back from the closing one empties it again. `addEdit` folds the second write into the first rather than letting the two be applied one after the other, which would write at an index the first has already moved.
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
			 * Reports a parentheses newline violation.
			 * @param message - The error message to report.
			 * @param offset - The offset index of the violation.
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
 * Gets the whitespace before the first non-comment, non-space node in a function, and says where that node begins.
 *
 * A comment may stand between the parenthesis and the line break the `always` options ask for, so it is walked past and the whitespace behind it counted. `postcss-value-parser` knows nothing of a comment opened by a double slash and hands out two division signs and a word where one stands, so the nodes that make up such a comment are placed against the spans it occupies instead.
 *
 * Where the function holds nothing but comments and whitespace, the first significant thing is its own closing parenthesis, which is what the `never` fix would then pull up.
 *
 * Where each stretch of that whitespace stands is answered alongside it, since the `never` guard has to know whether the fix reaches every one of them: what it does not reach stays, and the option stays violated behind a problem Stylelint has been told is solved.
 * @param valueNode - The function node to check.
 * @param openingIndex - Where the text behind the function's opening parenthesis begins.
 * @param declValue - The value the node was parsed from, which its positions count in.
 * @param comments - The spans the comments of the value occupy in it, both kinds.
 * @returns The whitespace, the index the first significant thing behind it begins at — the node the parser hands back where one stands, the code a node of a comment's text reaches past that comment's end with where the parser filed one under such a node, and the function's own closing parenthesis where it holds neither — and the stretches the whitespace was gathered from.
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
			// The value parser hangs the whitespace behind a node on that node rather than emitting a node of its own for it, so the break closing the comment reaches past the comment's end whenever the last thing it spells is a division sign, a colon or a comma. It is whitespace of the value like any other, and the walk would drop it with the node it hangs on. A node the comment opened inside of, rather than one carrying whitespace behind it, goes on past that end with code: a call the parser closed a line below, a string it closed there, or a word. A word reaches that far two ways — as the whole of what an `url()` hands back, wherever a parenthesis or a quotation mark left unbalanced has the scan reading no address there, and as the word a backslash at the end of a comment's text carries across the break. Only the whitespace at the front of the overrun is the value's, and counting the code along with it is #303. A block comment the parser opened inside such a text is stepped over by its kind three lines above and never reaches here at all — and so is the node the parser makes of a block comment of the value, whose span the scan lays over the whole of the comment; what the parser reads as nodes behind a comment opening `/*/` is held by that span and passed over here like the text of an inline one, its overrun measured the same way.
			//
			// A run is read rather than the one break the comment is closed by, since the indentation of the line below stands behind that break and is whitespace of the value as much as it is. Reading a run also asks nothing of where the span came from, and there are two places: the scan of this value cuts a span that ends in front of a break, or at the end of the value where the comment runs to it and nothing can reach past it at all, while a span found again over what the fixes collected so far would leave behind is mapped back, and an end standing inside text a fix wrote maps to the index that text was written at.
			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0]

				before += whitespace
				measured.push([span.end, span.end + whitespace.length])

				// The code behind that whitespace is the first significant thing the function holds, whatever the parser made of the boundaries of the node it filed the code under, so the walk ends on it. Going on instead would gather the whitespace of the nodes behind it into a run the file does not spell, since code stands in the middle of that run.
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

		firstIndex = node.sourceIndex
		break
	}

	return { before, firstIndex, measured }
}

/**
 * Reads the whitespace in front of a function's closing parenthesis: what the function keeps in front of the parenthesis itself, and every whitespace node standing behind the last significant one, the block comments among them stepped over. As {@link getCheckBefore} walks out from the opening parenthesis, this walks back from the closing one, and reads a node standing in the text of a block comment the same way: it is text of that comment whatever the parser made of it, and the whitespace it reaches past the comment's end with is whitespace of the value — the parser hangs the whitespace behind a division sign on the sign, and the closing slash of a comment opening `/*\/` is such a sign to it (#378). Where code stands in that overrun the code is the last significant thing, and the walk ends on it.
 *
 * An inline comment ends the walk, which comes back from the parenthesis and goes no further than the comment's end, as it always has: the break behind such a comment is the one that closes it, which no fix may take away, so the whitespace the option can be asked about is what stands between the comment and the parenthesis, and a fix that empties it puts the parenthesis on the line of whatever block comment stands there. The opening side reads on past such a comment and refuses its fix instead; the two are asymmetric, and this side keeps the reading its cases were written for.
 *
 * Where each stretch of the whitespace stands is answered alongside it, since the `never` fix empties those very stretches and the guard in front of it asks whether the fix reaches every one of them.
 * @param valueNode - The function node to check.
 * @param declValue - The value the node was parsed from, which its positions count in.
 * @param comments - The spans the comments of the value occupy in it, both kinds.
 * @returns The whitespace, and the stretches it was gathered from, in the order they stand in the value, the one in front of the parenthesis last.
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
 * Names the span the break the `always` options ask for is written into, in front of the whitespace that stands closest to the first significant node, so that a comment written between the parenthesis and that node keeps its line. Nothing else of the value is named: what stood in the whitespace is written back behind the break.
 *
 * The stretch is the last the walk measured, which is that whitespace: the run behind the parenthesis where the function keeps nothing else in front of its first node, a whitespace node the walk passed, or the whitespace a node the parser filed a comment's text under reaches past the comment's end with — the parser hangs the whitespace behind a division sign on the sign, and the closing slash of a comment opening `/*\/` is such a sign to it, so a walk by whitespace nodes found nothing there, or found the whitespace node the parser had filed inside the comment's text, and wrote the break at the parenthesis behind which the comment stood or behind the comment's first three characters (#378). The stretch behind an inline comment opens on the break that closes it, and a break is what the options writing here ask for, so the last stretch is never that one.
 * @param measured - The stretches the walk measured the whitespace behind the opening parenthesis over, in the order it met them.
 * @param declValue - The value the stretches are counted in.
 * @param newline - The newline character to use.
 * @returns The edit the fix writes, a span of the value the file spells.
 */
function fixBeforeForAlways (measured: [number, number][], declValue: string, newline: string): Edit[] {
	let [start, end] = measured.at(-1) as [number, number]

	return [{ start, end, text: newline + declValue.slice(start, end) }]
}

/**
 * Names the spans the whitespace before the first node is emptied at for the 'never' expectation.
 *
 * They are the very stretches the guard weighed, so that what the option asks for and what the fix reaches are one list read twice rather than two walks written apart.
 * @param measured - The stretches the walk measured the whitespace behind the opening parenthesis over.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixBeforeForNever (measured: [number, number][]): Edit[] {
	return measured.map(([start, end]) => ({ start, end, text: `` }))
}

/**
 * Names the span the whitespace after the last node is written into for the 'always' expectation.
 * @param valueNode - The function node to fix.
 * @param newline - The newline character to use.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixAfterForAlways (valueNode: FunctionNode, newline: string): Edit[] {
	let { start, end } = getAfterSpan(valueNode)

	return [{ start, end, text: newline + valueNode.after }]
}

/**
 * Names the spans the whitespace after the last node is emptied at for the 'never' expectation.
 *
 * They are the very stretches the guard weighed, so that what the option asks for and what the fix reaches are one list read twice rather than two walks written apart.
 * @param measured - The stretches the walk measured the whitespace in front of the closing parenthesis over.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixAfterForNever (measured: [number, number][]): Edit[] {
	return measured.map(([start, end]) => ({ start, end, text: `` }))
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
