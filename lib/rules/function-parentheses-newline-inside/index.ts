import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { LEADING_WHITESPACE, LINE_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { addEdit, applyEditsFromEnd, type Edit, toIndexBeforeEdits } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpanAt, findInlineCommentSpanHolding, findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

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
 * Finds the spans the inline comments of a value occupy once the fixes collected so far are written into it, counted in the value as the file spells it.
 *
 * A comment opened by a double slash is closed by the first line break behind it, and the `always` options of this rule write line breaks. So a fix closes such a comment wherever the file left it running to the end of the value, and everything the comment used to hold behind that break is code of the value from then on — a function among it. Read against the spans the value had before that fix, such a function is passed over as a comment's text, and the problem it has waits for the next run (#288).
 *
 * The spans are placed back in the coordinates of the value the file spells, since that is what the nodes of the parse are counted in — and the parse itself survives every one of these fixes untouched, `postcss-value-parser` knowing nothing of a comment opened by a double slash and reading its text as ordinary nodes whether it is closed early or not.
 * @param declValue - The value the rule has read and parsed.
 * @param edits - The fixes collected so far, each one a span of that value.
 * @param spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns The spans, in the coordinates of the value the file spells.
 */
function findInlineCommentSpansAfterEdits (declValue: string, edits: Edit[], spellsInlineComments: boolean): InlineCommentSpan[] {
	return findInlineCommentSpans(applyEditsFromEnd(declValue, edits), spellsInlineComments)
		.map(({ start, end }) => ({ start: toIndexBeforeEdits(start, edits), end: toIndexBeforeEdits(end, edits) }))
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
 * @param inlineComments - The spans the inline comments of the value occupy in it.
 * @returns True where the rule may read the function's parentheses and write between them.
 */
function isFunctionParsedAsWritten (syntax: Syntax, valueNode: FunctionNode, inlineComments: InlineCommentSpan[]): boolean {
	if (!syntax.isStandardFunction(valueNode)) return false

	if (valueNode.unclosed) return false

	// The parenthesis the node ends on, asked after `unclosed` because a node marked so ends on no parenthesis of its own while the index still lands on a character: `f(1px // /*` and ` c`, a break and `2px)` ends on a parenthesis standing outside every comment, and `f("abc)` ends one character past the text altogether
	return !findInlineCommentSpanAt(valueNode.sourceEndIndex - 1, inlineComments)
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
	return firstIndex + (declValue.slice(firstIndex).match(LEADING_WHITESPACE) as RegExpMatchArray)[0].length
}

/**
 * Names the span the whitespace in front of a function's closing parenthesis stands in.
 *
 * A function the parser has marked unclosed never gets here, so the parenthesis is the character the node ends on.
 * @param valueNode - The function being fixed.
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
 * Where the `never` fix would empty the whitespace behind a function's opening parenthesis.
 *
 * It empties what the function keeps in front of its first node and then every whitespace node behind that, stepping over the comments among them and stopping at anything else — the first division sign an inline comment is spelled with among that anything, since the value parser knows of no such comment and hands out two of them and a word where one stands.
 * @param valueNode - The function whose opening parenthesis is being fixed.
 * @param openingIndex - Where the text behind that parenthesis begins.
 * @returns The stretches, in ascending order and none of them overlapping.
 */
function getFixEmptiedBefore (valueNode: FunctionNode, openingIndex: number): [number, number][] {
	let emptied: [number, number][] = [[openingIndex, openingIndex + valueNode.before.length]]

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		if (node.type !== `space`) break

		emptied.push([node.sourceIndex, node.sourceEndIndex])
	}

	return emptied
}

/**
 * Where the `never` fix would empty the whitespace in front of a function's closing parenthesis.
 *
 * It empties every whitespace node standing behind the last significant one, walking back over the comments among them exactly as {@link getFixEmptiedBefore} walks out over them, and then what the function keeps in front of the parenthesis itself.
 * @param valueNode - The function whose closing parenthesis is being fixed.
 * @returns The stretches, in ascending order and none of them overlapping.
 */
function getFixEmptiedAfter (valueNode: FunctionNode): [number, number][] {
	let emptied: [number, number][] = []

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		if (node.type !== `space`) break

		emptied.unshift([node.sourceIndex, node.sourceEndIndex])
	}

	let { start, end } = getAfterSpan(valueNode)

	emptied.push([start, end])

	return emptied
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
	openingIndex: number,
	checkBefore: string,
	checkAfter: string,
	firstIndex: number,
	measured: [number, number][],
	reading: InlineCommentReading,
}): {
	isOpeningFixable: boolean,
	isClosingFixable: boolean,
} {
	let { declValue, valueNode, openingIndex, checkBefore, checkAfter, firstIndex, measured, reading } = read

	let firstCharacterIndex = findFirstCharacterIndex(declValue, firstIndex)
	let { end: closingParenthesisIndex } = getAfterSpan(valueNode)
	let emptiedBefore = checkBefore === `` ? [] : getFixEmptiedBefore(valueNode, openingIndex)
	let emptiedAfter = checkAfter === `` ? [] : getFixEmptiedAfter(valueNode)
	// The fix reaches less far than the walk that measured the whitespace behind the opening parenthesis: that one steps over the nodes an inline comment is spelled with, and the fix stops at the first of them. What it does not reach stays, the option stays violated, and Stylelint calls the problem solved and hands the next run the same one (#285). So the fix is written only where it empties every stretch that was measured. The safety question is then put over what the fixer empties rather than over what was measured, the first being the honest set to ask about.
	//
	// Asking it over either answers the same, and by a shorter road than it used to be given here: with the question above answered yes, the two are not two lists at all. Both walks push the whitespace nodes of the function, stepping over the block comments among them, and the fix stops at the node the parser files an inline comment's first slash under — so a stretch the walk measures past that node is one the fix does not reach, and the question is never asked where there is one. Everything in front of that node is walked alike by both.
	//
	// The reason given before was that the two differ only by whitespace standing inside a comment's span, and that no such whitespace can hold the break closing that comment, the span ending at that break. The second half is not true of every span the rule reads: a span the scan of this value cuts does end in front of a break, but one found again over what the fixes collected so far would leave behind is mapped back, and an end standing inside text a fix wrote maps to the index that text was written at (#288). `bar(foo(// c))` under `postcss-less` and `always` hands the walk a span ending on a closing parenthesis. Nothing here rests on that reading any longer, and a walk widened to reach past an inline comment would want the argument above rather than that one.
	let isOpeningFixable = checkBefore !== `` && measured.every(([start, end]) => emptiedBefore.some(([from, to]) => from <= start && to >= end)) && !movesIntoComment(syntax, declValue, firstCharacterIndex, emptiedBefore, reading)
	let isClosingFixable = checkAfter !== `` && !movesIntoComment(syntax, declValue, closingParenthesisIndex, emptiedAfter, reading)

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
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary nodes
			let inlineComments = findInlineCommentSpans(declValue, reading.spells)
			// A break this rule writes closes such a comment where the file left one open, so the spans above describe a value the functions behind that write no longer stand in. They are found again before the next function is read, and only there: a value nothing has been written into holds the comments it was scanned for, and a run without `--fix` writes nothing at all.
			let areSpansStale = false
			let parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				if (areSpansStale) {
					inlineComments = findInlineCommentSpansAfterEdits(declValue, edits, reading.spells)
					areSpansStale = false
				}

				// A call standing in the text of an inline comment is no call of the value, and its parentheses are none of this rule's: leave it alone. A call nested inside it is still walked and asked the same question, since one opened inside such a comment reaches past the break that closes it and gathers code the file spells.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, inlineComments)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// What the walk reads of the function ... Both sides of it are read before either is reported on: under `never-multi-line` the two fixes are weighed against one another, so neither can be handed to a warning before the other has been weighed.
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex, measured } = getCheckBefore(valueNode, openingIndex, declValue, inlineComments)
				let closingIndex = valueNode.sourceIndex + functionString.length - 2
				let checkAfter = getCheckAfter(valueNode)
				let { isOpeningFixable, isClosingFixable } = isMultiLine && primary === `never-multi-line`
					? getNeverFixability(syntax, { declValue, valueNode, openingIndex, checkBefore, checkAfter, firstIndex, measured, reading })
					: { isOpeningFixable: false, isClosingFixable: false }

				// Check opening ...
				if (primary === `always` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(valueNode, openingIndex, getLineBreak(syntax, root, result)))
					complain(messages.expectedOpening, openingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(valueNode, openingIndex, getLineBreak(syntax, root, result)))
					complain(messages.expectedOpeningMultiLine, openingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
					fix = isOpeningFixable ? fixWith(() => fixBeforeForNever(valueNode, openingIndex)) : undefined
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
					fix = isClosingFixable ? fixWith(() => fixAfterForNever(valueNode)) : undefined
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
 * @param inlineComments - The spans the inline comments of the value occupy in it.
 * @returns The whitespace, the index the first significant thing behind it begins at — the node the parser hands back where one stands, the code a node of a comment's text reaches past that comment's end with where the parser filed one under such a node, and the function's own closing parenthesis where it holds neither — and the stretches the whitespace was gathered from.
 */
function getCheckBefore (valueNode: FunctionNode, openingIndex: number, declValue: string, inlineComments: InlineCommentSpan[]): {
	before: string,
	firstIndex: number,
	measured: [number, number][],
} {
	let before = valueNode.before
	let measured: [number, number][] = [[openingIndex, openingIndex + valueNode.before.length]]
	let firstIndex = valueNode.sourceEndIndex - 1

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		let span = findInlineCommentSpanHolding(node, inlineComments)

		if (span) {
			// The value parser hangs the whitespace behind a node on that node rather than emitting a node of its own for it, so the break closing the comment reaches past the comment's end whenever the last thing it spells is a division sign, a colon or a comma. It is whitespace of the value like any other, and the walk would drop it with the node it hangs on. A node the comment opened inside of, rather than one carrying whitespace behind it, goes on past that end with code: a call the parser closed a line below, a string it closed there, or a word. A word reaches that far two ways — as the whole of what an `url()` hands back, wherever a parenthesis or a quotation mark left unbalanced has the scan reading no address there, and as the word a backslash at the end of a comment's text carries across the break. Only the whitespace at the front of the overrun is the value's, and counting the code along with it is #303. A block comment the parser opened inside such a text is stepped over by its kind three lines above and never reaches here at all.
			//
			// A run is read rather than the one break the comment is closed by, since the indentation of the line below stands behind that break and is whitespace of the value as much as it is. Reading a run also asks nothing of where the span came from, and there are two places: the scan of this value cuts a span that ends in front of a break, or at the end of the value where the comment runs to it and nothing can reach past it at all, while a span found again over what the fixes collected so far would leave behind is mapped back, and an end standing inside text a fix wrote maps to the index that text was written at.
			if (node.sourceEndIndex > span.end) {
				let overrun = declValue.slice(span.end, node.sourceEndIndex)
				// The run may be empty, so the pattern matches every text
				let whitespace = (overrun.match(LEADING_WHITESPACE) as RegExpMatchArray)[0]

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
 * Gets the whitespace after the last non-comment, non-space node in a function.
 * @param valueNode - The function node to check.
 * @returns The whitespace after the last significant node.
 */
function getCheckAfter (valueNode: FunctionNode): string {
	let after = ``

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			after = node.value + after
			continue
		}

		break
	}

	after += valueNode.after

	return after
}

/**
 * Names the spans the whitespace before the first node is written into for the 'always' expectation.
 *
 * The break goes in front of the whitespace that stands closest to the first significant node, so a comment written between the parenthesis and that node keeps its line. Nothing else of the value is named: what stood in the whitespace is written back behind the break.
 * @param valueNode - The function node to fix.
 * @param openingIndex - Where the text behind that function's opening parenthesis begins.
 * @param newline - The newline character to use.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixBeforeForAlways (valueNode: FunctionNode, openingIndex: number, newline: string): Edit[] {
	let target

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			target = node
			continue
		}

		break
	}

	if (target) return [{ start: target.sourceIndex, end: target.sourceIndex + target.value.length, text: newline + target.value }]

	return [{ start: openingIndex, end: openingIndex + valueNode.before.length, text: newline + valueNode.before }]
}

/**
 * Names the spans the whitespace before the first node is emptied at for the 'never' expectation.
 *
 * They are the very stretches the guard weighed, so that what the option asks for and what the fix reaches are one list read twice rather than two walks written apart.
 * @param valueNode - The function node to fix.
 * @param openingIndex - Where the text behind that function's opening parenthesis begins.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixBeforeForNever (valueNode: FunctionNode, openingIndex: number): Edit[] {
	return getFixEmptiedBefore(valueNode, openingIndex).map(([start, end]) => ({ start, end, text: `` }))
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
 * @param valueNode - The function node to fix.
 * @returns The edits the fix writes, each one a span of the value the file spells.
 */
function fixAfterForNever (valueNode: FunctionNode): Edit[] {
	return getFixEmptiedAfter(valueNode).map(([start, end]) => ({ start, end, text: `` }))
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
