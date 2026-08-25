import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_FORM_FEED, EVERY_WHITESPACE_RUN, LEADING_WHITESPACE, LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { addEdit, applyEditsFromEnd } from "../../utils/applyEditsFromEnd/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { findInlineCommentSpanHolding, findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isSingleLineString } from "../../utils/isSingleLineString/index.js"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `function-parentheses-newline-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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

/** @typedef {import('../../utils/applyEditsFromEnd/index.js').Edit} Edit */

/**
 * Asks whether the file spells the function the value parser has handed back.
 *
 * A preprocessor construct is none, and neither is a function the parser has marked unclosed. The parser knows nothing of a comment opened by a double slash, so a `/*` standing in the text of one opens a block comment to it that never closes and swallows the closing parenthesis of every function open around it. The stringifier then prints what such a node keeps in front of its parenthesis behind it instead, so the whitespace an `always` option asks for there lands outside the function; PostCSS trims that whitespace out of the value and into the raws of what follows, which leaves the value looking untouched to the next run, and the next run writes another one — a character a run, for as long as the fixer is asked (#131).
 *
 * The whole node is turned away rather than the closing half of it, warning and all: the parentheses the options are about are not where the parser puts them, and nothing read out of a value the parser has misread this way is worth reporting. A closed call standing inside such a function is reached by the walk as ever, and read and fixed where it stands. A bracket the file really leaves open never gets here — PostCSS throws on one of those before any rule sees the declaration — so a comment is the only thing the second question turns away.
 * @param {FunctionNode} valueNode - The function the walk has reached.
 * @returns {boolean} True where the rule may read the function's parentheses and write between them.
 */
function isFunctionParsedAsWritten (valueNode) {
	if (!isStandardSyntaxFunction(valueNode)) return false

	return !valueNode.unclosed
}

/**
 * Asks whether an inline comment holds the character a text ends with, under each of the two readings of a line break a syntax of this plugin has.
 *
 * A comment is closed by a break, and the two syntaxes disagree about one character: Sass ends a comment on a form feed, and Less, which normalises the line endings of a file before parsing it, reads no line in one at all. So there are two readings, and each of them is a whole language rather than a pole: the breaks both syntaxes read, and those with a form feed among them. Both are asked of both sides of the fix, so that an answer never describes one language before the fix and the other after it.
 *
 * The two separators of Unicode are read by neither, and they need no reading of their own. A fix here writes over whitespace, and the value parser counts as space only what stands below the blank, so a separator survives every fix this guard stands in front of — whatever a reading makes of it, it makes the same of it before the fix and after, and it can never be what carries a parenthesis or an argument into a comment.
 *
 * The character the question is about stands at the end of the text rather than being named apart from it. `endsWithInlineComment` reads trailing whitespace as room a fix is about to write in, which is the question its other callers ask and the opposite of this one, and whitespace standing at the end — a separator of Unicode, or the break that closes the comment — would otherwise be trimmed away and the comment in front of it read as still open.
 * @param {string} text - The text, ending with the character a comment either holds or does not.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {{ shared: boolean, formFeed: boolean }} Whether a comment holds that character under the breaks both syntaxes read, and under those with a form feed among them.
 */
function readsInsideComment (text, spellsInlineComments) {
	return {
		shared: endsWithInlineComment(text, spellsInlineComments),
		formFeed: endsWithInlineComment(text.replaceAll(EVERY_FORM_FEED, `\n`), spellsInlineComments),
	}
}

/**
 * Takes the given stretches out of a text.
 * @param {string} text - The text to cut.
 * @param {number[][]} ranges - The stretches to take out, in ascending order and none of them overlapping.
 * @returns {string} What is left once they are gone.
 */
function withoutRanges (text, ranges) {
	let kept = ``
	let index = 0

	for (let [start, end] of ranges) {
		kept += text.slice(index, start)
		index = end
	}

	return kept + text.slice(index)
}

/**
 * Asks whether the fix would take a function's closing parenthesis from outside an inline comment into one.
 *
 * Both questions are put to each reading, and the guard declines where one and the same reading has the parenthesis outside a comment as the value stands and inside one once the fix has run. A reading holding it inside on both sides describes a value already broken, which the fix leaves no worse; a reading holding it outside on both sides describes one the fix does not reach. Putting one question to one reading and the other to the other — which is what this did until #132 — answers about two languages at once and declines fixes neither language is at risk from.
 * @param {string} declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param {FunctionNode} valueNode - The function whose closing parenthesis is being fixed.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {boolean} True where a reading has the parenthesis move into a comment.
 */
function movesClosingIntoComment (declValue, valueNode, spellsInlineComments) {
	let closingIndex = valueNode.sourceEndIndex - 1
	// The fix empties the whitespace the function keeps in front of the parenthesis and then every whitespace node behind it, stepping over the comments among them and stopping at anything else, so all of that closes up against the parenthesis on one line
	let emptiedIndex = closingIndex - valueNode.after.length

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type !== `comment` && node.type !== `space`) break

		emptiedIndex = node.sourceIndex
	}

	let standingText = declValue.slice(0, closingIndex)
	let keptText = declValue.slice(0, emptiedIndex)
	// Closing the gap up can also bring a slash against a comment's own and open a comment that was never there, so what the fix would leave behind is what has to be looked at, not what stands. The run taken out here is wider than the one the fix empties — the fix empties nodes the value parser calls space, and this takes out everything JavaScript calls whitespace, a separator of Unicode among it — and it is wider only the safe way: taking characters out can add no line break, and none of them stands in the text in front of the double slash, so a scan left inside a comment stays inside one and none is carried out of it.
	let fixedText = `${keptText}${standingText.slice(keptText.length).replaceAll(EVERY_WHITESPACE_RUN, ``)}`
	let standing = readsInsideComment(`${standingText})`, spellsInlineComments)
	let fixed = readsInsideComment(`${fixedText})`, spellsInlineComments)

	return (!standing.shared && fixed.shared) || (!standing.formFeed && fixed.formFeed)
}

/**
 * Where the `never` fix would empty the whitespace behind a function's opening parenthesis.
 *
 * It empties what the function keeps in front of its first node and then every whitespace node behind that, stepping over the comments among them and stopping at anything else — the first division sign an inline comment is spelled with among that anything, since the value parser knows of no such comment and hands out two of them and a word where one stands.
 * @param {FunctionNode} valueNode - The function whose opening parenthesis is being fixed.
 * @param {number} openingIndex - Where the text behind that parenthesis begins.
 * @returns {number[][]} The stretches, in ascending order and none of them overlapping.
 */
function getFixEmptied (valueNode, openingIndex) {
	let emptied = [[openingIndex, openingIndex + valueNode.before.length]]

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		if (node.type !== `space`) break

		emptied.push([node.sourceIndex, node.sourceEndIndex])
	}

	return emptied
}

/**
 * Asks whether the fix would take the first significant thing a function holds from outside an inline comment into one.
 *
 * Both questions are put to each reading, exactly as {@link movesClosingIntoComment} puts them: the guard declines where one and the same reading has that thing outside a comment as the value stands and inside one once the fix has run. Asking only the second of the two — which is what this did until #281, `endsWithInlineComment` trimming the trailing whitespace away and so reading the text the fix would leave behind — turns away a value whose first argument stands inside a comment already, where emptying the whitespace moves nothing anywhere it was not, and lets through one where the fix empties whitespace on both sides of a block comment, whose trimmed text is neither of the two.
 *
 * The question is about the first character of that thing which is not whitespace. The value parser hangs the whitespace in front of a division sign, a colon and a comma on the node itself rather than emitting a node of its own for it, so the first significant node may begin in whitespace, and a text cut off at its beginning would be read with that whitespace trimmed away — the break closing a comment among it.
 * @param {string} declValue - The value the rule has read and parsed, which the positions count in.
 * @param {number} firstIndex - Where the first significant node of the function begins.
 * @param {number[][]} emptied - The stretches {@link getFixEmptied} answers with.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {boolean} True where a reading has that thing move into a comment.
 */
function movesOpeningIntoComment (declValue, firstIndex, emptied, spellsInlineComments) {
	let firstCharacterIndex = firstIndex + declValue.slice(firstIndex).match(LEADING_WHITESPACE)[0].length
	let standingText = declValue.slice(0, firstCharacterIndex + 1)
	let standing = readsInsideComment(standingText, spellsInlineComments)
	let fixed = readsInsideComment(withoutRanges(standingText, emptied), spellsInlineComments)

	return (!standing.shared && fixed.shared) || (!standing.formFeed && fixed.formFeed)
}

/**
 * Requires a newline or disallows whitespace on the inside of the parentheses of functions.
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions, context) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`, `never-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let fix = null
			// What a fix changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
			/** @type {Edit[]} */
			let edits = []
			let declValue = getDeclarationValue(decl)
			// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
			let spellsInlineComments = readsInlineComments(decl, result)
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary nodes
			let inlineComments = findInlineCommentSpans(declValue, endsInlineCommentOnFormFeed(decl), spellsInlineComments)
			let parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				// A call standing in the text of an inline comment is no call of the value, and its parentheses are none of this rule's: leave it alone. A call nested inside it is still walked and asked the same question, since one opened inside such a comment reaches past the break that closes it and gathers code the file spells.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				if (!isFunctionParsedAsWritten(valueNode)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex, measured } = getCheckBefore(valueNode, openingIndex, declValue, inlineComments)

				if (primary === `always` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(valueNode, openingIndex, context.newline || ``))
					complain(messages.expectedOpening, openingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkBefore)) {
					fix = fixWith(() => fixBeforeForAlways(valueNode, openingIndex, context.newline || ``))
					complain(messages.expectedOpeningMultiLine, openingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
					// Two things have to hold before the whitespace may be emptied: the fixer has to reach all of it, and emptying it must not take the first argument into an inline comment standing in front of it. A function holding nothing but comments is asked the second about its own closing parenthesis, which is what the fix would then pull up.
					let emptied = getFixEmptied(valueNode, openingIndex)
					// The fix reaches less far than the walk that measured this whitespace: that one steps over the nodes an inline comment is spelled with, and the fix stops at the first of them. What it does not reach stays, the option stays violated, and Stylelint calls the problem solved and hands the next run the same one (#285). So the fix is written only where it empties every stretch that was measured. The safety question below is then put over what the fixer empties rather than over what was measured, the first being the honest set to ask about; the two answer alike, since with this question answered they differ only by whitespace standing inside a comment's span, and no such whitespace can hold the break that closes that comment — the span ends at that break.
					let isOpeningFixable = measured.every(([start, end]) => emptied.some(([from, to]) => from <= start && to >= end)) && !movesOpeningIntoComment(declValue, firstIndex, emptied, spellsInlineComments)

					fix = isOpeningFixable ? fixWith(() => fixBeforeForNever(valueNode, openingIndex)) : null
					complain(messages.rejectedOpeningMultiLine, openingIndex)
				}

				// Check closing ...
				let closingIndex = valueNode.sourceIndex + functionString.length - 2
				let checkAfter = getCheckAfter(valueNode)

				if (primary === `always` && !LINE_BREAK.test(checkAfter)) {
					fix = fixWith(() => fixAfterForAlways(valueNode, context.newline || ``))
					complain(messages.expectedClosing, closingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !LINE_BREAK.test(checkAfter)) {
					fix = fixWith(() => fixAfterForAlways(valueNode, context.newline || ``))
					complain(messages.expectedClosingMultiLine, closingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkAfter !== ``) {
					// The parenthesis goes right after this text, and the whitespace run the fix empties ends it. Where an inline comment stands there, the line break that run holds is what closes the comment, so the fix would take the parenthesis, and the semicolon behind it, into the comment's text: leave the value alone and let the warning stand
					let isFixable = !movesClosingIntoComment(declValue, valueNode, spellsInlineComments)

					fix = isFixable ? fixWith(() => fixAfterForNever(valueNode)) : null
					complain(messages.rejectedClosingMultiLine, closingIndex)
				}
			})

			if (edits.length > 0) setDeclarationValue(decl, applyEditsFromEnd(declValue, edits))

			/**
			 * Hands `report` a fix that adds the spans a write changes to the list the value is edited by.
			 *
			 * Two writes of this rule can name one and the same span. An empty function is one: everything such a call holds between its parentheses is whitespace the parser hands back as `before`, so the span in front of the closing parenthesis is the same empty span as the one behind the opening one, and both halves of an `always` option ask for a break there. A whitespace node standing between two comments is another: under `never-multi-line` the walk out from the opening parenthesis empties it, and the walk back from the closing one empties it again. `addEdit` folds the second write into the first rather than letting the two be applied one after the other, which would write at an index the first has already moved.
			 * @param {() => Edit[]} write - The spans the write changes, and what goes in each.
			 * @returns {() => void} The fix.
			 */
			function fixWith (write) {
				return () => {
					for (let edit of write()) addEdit(edits, edit)
				}
			}

			/**
			 * Reports a parentheses newline violation.
			 * @param {string} message - The error message to report.
			 * @param {number} offset - The offset index of the violation.
			 */
			function complain (message, offset) {
				let problemIndex = declarationValueIndex(decl) + offset

				report({
					ruleName,
					result,
					message,
					node: decl,
					index: problemIndex,
					endIndex: problemIndex,
					fix,
				})
			}
		})
	}
}

/** @typedef {import('postcss-value-parser').FunctionNode} FunctionNode */

/**
 * Gets the whitespace before the first non-comment, non-space node in a function, and says where that node begins.
 *
 * A comment may stand between the parenthesis and the line break the `always` options ask for, so it is walked past and the whitespace behind it counted. `postcss-value-parser` knows nothing of a comment opened by a double slash and hands out two division signs and a word where one stands, so the nodes that make up such a comment are placed against the spans it occupies instead.
 *
 * Where the function holds nothing but comments and whitespace, the first significant thing is its own closing parenthesis, which is what the `never` fix would then pull up.
 *
 * Where each stretch of that whitespace stands is answered alongside it, since the `never` guard has to know whether the fix reaches every one of them: what it does not reach stays, and the option stays violated behind a problem Stylelint has been told is solved.
 * @param {FunctionNode} valueNode - The function node to check.
 * @param {number} openingIndex - Where the text behind the function's opening parenthesis begins.
 * @param {string} declValue - The value the node was parsed from, which its positions count in.
 * @param {import('../../utils/findInlineCommentSpans/index.js').InlineCommentSpan[]} inlineComments - The spans the inline comments of the value occupy in it.
 * @returns {{ before: string, firstIndex: number, measured: number[][] }} The whitespace, the index the first significant node begins at, and the stretches the whitespace was gathered from.
 */
function getCheckBefore (valueNode, openingIndex, declValue, inlineComments) {
	let before = valueNode.before
	let measured = [[openingIndex, openingIndex + valueNode.before.length]]
	let firstIndex = valueNode.sourceEndIndex - 1

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		let span = findInlineCommentSpanHolding(node, inlineComments)

		if (span) {
			// The value parser hangs the whitespace behind a node on that node rather than emitting a node of its own for it, so the break closing the comment reaches past the comment's end whenever the last thing it spells is a division sign, a colon or a comma. It is whitespace of the value like any other, and the walk would drop it with the node it hangs on. A node the comment opened inside of rather than one carrying whitespace behind it — a call, or the word an `url()` hands back whole — reaches past that end with code, and counting that code as whitespace is #303; it is measured here as it always was, and the fix reaches none of it either way.
			if (node.sourceEndIndex > span.end) {
				before += declValue.slice(span.end, node.sourceEndIndex)
				measured.push([span.end, node.sourceEndIndex])
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
 * @param {FunctionNode} valueNode - The function node to check.
 * @returns {string} The whitespace after the last significant node.
 */
function getCheckAfter (valueNode) {
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
 * Names the span the whitespace in front of a function's closing parenthesis stands in.
 *
 * A function the parser has marked unclosed never gets here, so the parenthesis is the character the node ends on.
 * @param {FunctionNode} valueNode - The function being fixed.
 * @returns {{ start: number, end: number }} The span, counted in the value the file spells.
 */
function getAfterSpan (valueNode) {
	let end = valueNode.sourceEndIndex - 1

	return { start: end - valueNode.after.length, end }
}

/**
 * Names the spans the whitespace before the first node is written into for the 'always' expectation.
 *
 * The break goes in front of the whitespace that stands closest to the first significant node, so a comment written between the parenthesis and that node keeps its line. Nothing else of the value is named: what stood in the whitespace is written back behind the break.
 * @param {FunctionNode} valueNode - The function node to fix.
 * @param {number} openingIndex - Where the text behind that function's opening parenthesis begins.
 * @param {string} newline - The newline character to use.
 * @returns {Edit[]} The edits the fix writes, each one a span of the value the file spells.
 */
function fixBeforeForAlways (valueNode, openingIndex, newline) {
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
 * @param {FunctionNode} valueNode - The function node to fix.
 * @param {number} openingIndex - Where the text behind that function's opening parenthesis begins.
 * @returns {Edit[]} The edits the fix writes, each one a span of the value the file spells.
 */
function fixBeforeForNever (valueNode, openingIndex) {
	return getFixEmptied(valueNode, openingIndex).map(([start, end]) => ({ start, end, text: `` }))
}

/**
 * Names the span the whitespace after the last node is written into for the 'always' expectation.
 * @param {FunctionNode} valueNode - The function node to fix.
 * @param {string} newline - The newline character to use.
 * @returns {Edit[]} The edits the fix writes, each one a span of the value the file spells.
 */
function fixAfterForAlways (valueNode, newline) {
	let { start, end } = getAfterSpan(valueNode)

	return [{ start, end, text: newline + valueNode.after }]
}

/**
 * Names the spans the whitespace after the last node is emptied at for the 'never' expectation.
 *
 * The whitespace the function keeps in front of its parenthesis goes first, and then every whitespace node behind it, the comments among them stepped over and anything else stopping the walk.
 * @param {FunctionNode} valueNode - The function node to fix.
 * @returns {Edit[]} The edits the fix writes, each one a span of the value the file spells.
 */
function fixAfterForNever (valueNode) {
	let { start, end } = getAfterSpan(valueNode)
	let edits = [{ start, end, text: `` }]

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			edits.push({ start: node.sourceIndex, end: node.sourceIndex + node.value.length, text: `` })
			continue
		}

		break
	}

	return edits
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
