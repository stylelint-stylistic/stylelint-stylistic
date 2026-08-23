import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_FORM_FEED, LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isSingleLineString } from "../../utils/isSingleLineString/index.js"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `function-parentheses-space-inside`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedOpening: `Expected single space after "("`,
	rejectedOpening: `Unexpected whitespace after "("`,
	expectedClosing: `Expected single space before ")"`,
	rejectedClosing: `Unexpected whitespace before ")"`,
	expectedOpeningSingleLine: `Expected single space after "(" in a single-line function`,
	rejectedOpeningSingleLine: `Unexpected whitespace after "(" in a single-line function`,
	expectedClosingSingleLine: `Expected single space before ")" in a single-line function`,
	rejectedClosingSingleLine: `Unexpected whitespace before ")" in a single-line function`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** @typedef {import('postcss-value-parser').FunctionNode} FunctionNode */

/** A character put where the first argument of a function begins, so that the guard reading the text in front of it is answered about that position and not about the whitespace the fix would write over. Any character that opens nothing and that `String.prototype.trimEnd` leaves standing answers the same, and the argument's own first character is not one of those: the value parser counts as space only what stands below the blank, so a separator of Unicode standing there is a character of the argument, and `endsWithInlineComment` would trim it away together with the line break in front of it and read the comment as still open. */
const ARGUMENT_STAND_IN = `x`

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
 * Reads what a value holds in front of a position, in the spelling the file gives it.
 * @param {string} printedValue - The copy of the value the syntax prints.
 * @param {string} declValue - The copy the rule has read and parsed, which the index counts in.
 * @param {number} index - The position within that copy.
 * @returns {string} The text in front of the position, spelled as the file spells it.
 */
function printedBefore (printedValue, declValue, index) {
	let before = declValue.slice(0, index)

	// The syntax rewrote nothing, so the two copies are one and the same text, and reading them as two would rewrite a form feed into a line feed where Less reads no line in one at all
	if (printedValue === declValue) return before

	// `postcss-scss` rewrites every `//` comment of a value into a block comment, keeps the spelling of the file in a copy of its own and prints that copy. No rewriting crosses a line break, since an inline comment runs to the end of its line, so the two copies hold the same lines, and nothing can follow such a comment on its line either, so a position keeps its column as well. Every break CSS knows ends a line here, since a line is only counted, and each of them is one character long, so joining the lines back with a line feed keeps every position where it was. A comment whose own text holds `/*` or `*/` is rewritten into several block comments rather than one, and a position inside such a line is then read a few characters short — which can only make the rule decline a fix, never let one through, and reaches no output while the syntax discards the write anyway (#115). Repairing it belongs with that issue, which takes this mapping out of the way altogether by handing the rule the copy it prints.
	//
	// No case pins any of this — neither the members of the split, nor the join, nor the slice that cuts the last line: the only syntax the mapping tells apart is the one whose write is discarded before it reaches the file (#115), so the fixes it saves cannot be asserted until that is repaired. What the mapping must not do reaches the file, and is pinned: where the two copies are one and the same text it is not run at all.
	let lines = before.split(LINE_BREAK)
	let printedLines = printedValue.split(LINE_BREAK).slice(0, lines.length)

	return [...printedLines.slice(0, -1), printedLines.at(-1).slice(0, lines.at(-1).length)].join(`\n`)
}

/**
 * Asks whether an inline comment holds the end of a text, under each of the two readings of a line break a syntax of this plugin has.
 *
 * A comment is closed by a break, and the two syntaxes disagree about one character: Sass ends a comment on a form feed, and Less, which normalises the line endings of a file before parsing it, reads no line in one at all. So there are two readings, and each of them is a whole language rather than a pole: the breaks both syntaxes read, and those with a form feed among them. Both are asked of both sides of the fix, so that an answer never describes one language before the fix and the other after it.
 *
 * The two separators of Unicode are read by neither, and they need no reading of their own. A fix here writes over whitespace, and the value parser counts as space only what stands below the blank, so a separator survives every fix this guard stands in front of — whatever a reading makes of it, it makes the same of it before the fix and after, and it can never be what carries anything into a comment.
 *
 * The text ends with the character that must not fall inside a comment, and the caller writes it on the end for the asking — the closing parenthesis itself for one guard, {@link ARGUMENT_STAND_IN} for the other. `endsWithInlineComment` reads trailing whitespace as room a fix is about to write in, which is the question its other callers ask and the opposite of this one: the break closing the comment stands in that very whitespace here, and a character trimmed away with it would leave the comment in front of it read as still open.
 * @param {string} text - The text the fix would leave, ending with the character that must not fall inside a comment.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {{ shared: boolean, formFeed: boolean }} Whether a comment holds the end of the text under the breaks both syntaxes read, and under those with a form feed among them.
 */
function readsInsideComment (text, spellsInlineComments) {
	return {
		shared: endsWithInlineComment(text, spellsInlineComments),
		formFeed: endsWithInlineComment(text.replaceAll(EVERY_FORM_FEED, `\n`), spellsInlineComments),
	}
}

/**
 * Asks whether the fix would take a function's first argument from outside an inline comment into one.
 *
 * The fix writes the whitespace the function keeps behind its opening parenthesis and nothing else, so everything in front of that parenthesis stays where it is written and the argument closes up against it. Where an inline comment stands in front of the whitespace, the line break that whitespace holds is what closes the comment, so taking the break away leaves the argument, and everything the declaration has behind it, inside the comment's text.
 *
 * Both questions are put to each reading, the way #132 leaves the closing guard putting them, and the guard declines where one and the same reading has the argument outside a comment as the value stands and inside one once the fix has run.
 * @param {import('postcss').Declaration} decl - The declaration the function stands in.
 * @param {string} declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param {FunctionNode} valueNode - The function whose opening parenthesis is being fixed.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {boolean} True where a reading has the argument move into a comment.
 */
function movesOpeningIntoComment (decl, declValue, valueNode, spellsInlineComments) {
	let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
	let firstIndex = openingIndex + valueNode.before.length
	let raws = decl.raws
	let printedValue = (raws.value && raws.value.scss) || declValue
	let standingText = printedBefore(printedValue, declValue, firstIndex)
	// The fix writes the whitespace behind the parenthesis and nothing else, so everything in front of that parenthesis stays where it is written and the argument closes up against it. A single space is all the `always` options put there, and a space closes no comment, so both options leave the argument standing behind the same text.
	let fixedText = printedBefore(printedValue, declValue, openingIndex)
	let standing = readsInsideComment(`${standingText}${ARGUMENT_STAND_IN}`, spellsInlineComments)
	let fixed = readsInsideComment(`${fixedText}${ARGUMENT_STAND_IN}`, spellsInlineComments)

	return (!standing.shared && fixed.shared) || (!standing.formFeed && fixed.formFeed)
}

/**
 * Asks whether the fix would take a function's closing parenthesis from outside an inline comment into one.
 *
 * Both questions are put to each reading, and the guard declines where one and the same reading has the parenthesis outside a comment as the value stands and inside one once the fix has run. A reading holding it inside on both sides describes a value already broken, which the fix leaves no worse; a reading holding it outside on both sides describes one the fix does not reach. Putting one question to one reading and the other to the other — which is what this did until #132 — answers about two languages at once and declines fixes neither language is at risk from.
 * @param {import('postcss').Declaration} decl - The declaration the function stands in.
 * @param {string} declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param {FunctionNode} valueNode - The function whose closing parenthesis is being fixed.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {boolean} True where a reading has the parenthesis move into a comment.
 */
function movesClosingIntoComment (decl, declValue, valueNode, spellsInlineComments) {
	let closingIndex = valueNode.sourceEndIndex - 1
	let raws = decl.raws
	let printedValue = (raws.value && raws.value.scss) || declValue
	let standingText = printedBefore(printedValue, declValue, closingIndex)
	// The fix writes the whitespace the function keeps in front of the parenthesis and nothing else, so everything behind that whitespace stays on the line it is written on, and only the parenthesis moves. A single space is all the `always` options put there, and a space closes no comment, so both options leave the parenthesis standing behind the same text.
	let fixedText = printedBefore(printedValue, declValue, closingIndex - valueNode.after.length)
	// The parenthesis is written back on the end of each text, since it is the character the fix moves
	let standing = readsInsideComment(`${standingText})`, spellsInlineComments)
	let fixed = readsInsideComment(`${fixedText})`, spellsInlineComments)

	return (!standing.shared && fixed.shared) || (!standing.formFeed && fixed.formFeed)
}

/**
 * Requires a single space or disallows whitespace on the inside of the parentheses of functions.
 * @type {import('stylelint').Rule}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let fix = null
			let hasFixed = false
			let declValue = getDeclarationValue(decl)
			let parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				if (!isFunctionParsedAsWritten(valueNode)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				let isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				/**
				 * Asks whether the whitespace behind the opening parenthesis can be written at all.
				 *
				 * The first argument goes right after that whitespace, and the fix writes over the whitespace itself. Where an inline comment stands in front of it, the line break it holds is what closes the comment, so no option can be satisfied without taking the argument, and everything the declaration has behind it, into the comment's text: leave the value alone and let the warning stand, as the closing parenthesis has done since #114. The single-line options ask as well, cheaply and for safety's sake rather than against a shape any case pins: since #244 a form feed makes a function multi-line like every other break, so a function this rule counts as single-line holds no break for a comment of that kind to end on, and the text in front of its first argument would have to be left open by something standing outside the function itself.
				 *
				 * Only one option is ever in force, so this is asked once at most, and only where a problem has been found: reading the whole value in front of the argument, four times over, is not work to do for a function nothing is the matter with.
				 * @returns {boolean} True if the fix can write without commenting the first argument out.
				 */
				function isOpeningFixable () {
					// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: holding a fix back over a comment that is not there refuses a write nothing is the matter with
					let spellsInlineComments = readsInlineComments(decl, result)

					return !movesOpeningIntoComment(decl, declValue, valueNode, spellsInlineComments)
				}

				if (primary === `always` && valueNode.before !== ` `) {
					fix = fixBehind(isOpeningFixable, () => {
						valueNode.before = ` `
					})
					complain(messages.expectedOpening, openingIndex)
				}

				if (primary === `never` && valueNode.before !== ``) {
					fix = fixBehind(isOpeningFixable, () => {
						valueNode.before = ``
					})
					complain(messages.rejectedOpening, openingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.before !== ` `) {
					fix = fixBehind(isOpeningFixable, () => {
						valueNode.before = ` `
					})
					complain(messages.expectedOpeningSingleLine, openingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.before !== ``) {
					fix = fixBehind(isOpeningFixable, () => {
						valueNode.before = ``
					})
					complain(messages.rejectedOpeningSingleLine, openingIndex)
				}

				// Check closing ...
				let closingIndex = valueNode.sourceIndex + functionString.length - 2

				/**
				 * Asks whether the parenthesis can be moved at all.
				 *
				 * The parenthesis goes right after the text this reads, and the whitespace the fix overwrites ends it. Where an inline comment stands there, the line break that whitespace holds is what closes the comment, so no option can be satisfied without taking the parenthesis, and everything the declaration has left, into the comment's text: leave the value alone and let the warning stand. The single-line options ask as well, cheaply and for safety's sake rather than against a shape any case pins: since #244 a form feed makes a function multi-line like every other break, so a function this rule counts as single-line holds no break for a comment of that kind to end on, and the text in front of its parenthesis would have to be left open by something standing outside the function itself.
				 *
				 * Only one option is ever in force, so this is asked once at most, and only where a problem has been found: reading the whole value in front of the parenthesis, four times over, is not work to do for a function nothing is the matter with.
				 * @returns {boolean} True if the fix can write without commenting the parenthesis out.
				 */
				function isClosingFixable () {
					// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: holding a fix back over a comment that is not there refuses a write nothing is the matter with
					let spellsInlineComments = readsInlineComments(decl, result)

					return !movesClosingIntoComment(decl, declValue, valueNode, spellsInlineComments)
				}

				if (primary === `always` && valueNode.after !== ` `) {
					fix = fixBehind(isClosingFixable, () => {
						valueNode.after = ` `
					})
					complain(messages.expectedClosing, closingIndex)
				}

				if (primary === `never` && valueNode.after !== ``) {
					fix = fixBehind(isClosingFixable, () => {
						valueNode.after = ``
					})
					complain(messages.rejectedClosing, closingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.after !== ` `) {
					fix = fixBehind(isClosingFixable, () => {
						valueNode.after = ` `
					})
					complain(messages.expectedClosingSingleLine, closingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.after !== ``) {
					fix = fixBehind(isClosingFixable, () => {
						valueNode.after = ``
					})
					complain(messages.rejectedClosingSingleLine, closingIndex)
				}
			})

			if (hasFixed) setDeclarationValue(decl, parsedValue.toString())

			/**
			 * Hands `report` the fix for a write, or nothing at all where the guard standing in front of that write has turned it down.
			 *
			 * Stylelint reads the absence of a callback as the answer that the problem cannot be fixed, so the warning stands and the value is left exactly as it is.
			 * @param {() => boolean} isFixable - The guard the write stands behind, asked here and nowhere else, so that it is asked once and only where a problem has been found.
			 * @param {() => void} write - The write itself.
			 * @returns {(() => void) | null} The fix, or nothing.
			 */
			function fixBehind (isFixable, write) {
				if (!isFixable()) return null

				return () => {
					hasFixed = true
					write()
				}
			}

			/**
			 * Reports a parentheses space violation.
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

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
