import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_COMMENT_CLOSING_BREAK, EVERY_WHITESPACE_RUN, LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.js"
import { findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.js"
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

/**
 * Reads what a value holds in front of a position, in the spelling the file gives it.
 * @param {string} printedValue - The copy of the value the syntax prints.
 * @param {string} declValue - The copy the rule has read and parsed, which the index counts in.
 * @param {number} index - The position within that copy.
 * @returns {string} The text in front of the position, spelled as the file spells it.
 */
function printedBefore (printedValue, declValue, index) {
	let before = declValue.slice(0, index)

	// The syntax rewrote nothing, so the two copies are one and the same text
	if (printedValue === declValue) return before

	// `postcss-scss` rewrites every `//` comment of a value into a block comment, keeps the spelling of the file in a copy of its own and prints that copy. No rewriting crosses a line break, since an inline comment runs to the end of its line, so the two copies hold the same lines, and nothing can follow such a comment on its line either, so a position keeps its column as well. Every break CSS knows ends a line here, since a line is only counted, and each of them is one character long, so joining the lines back with a line feed keeps every position where it was. A comment whose own text holds `/*` or `*/` is rewritten into several block comments rather than one, and a position inside such a line is then read a few characters short — which can only make the rule decline a fix, never let one through, and reaches no output while the syntax discards the write anyway (#115). Repairing it belongs with that issue, which takes this mapping out of the way altogether by handing the rule the copy it prints.
	let lines = before.split(LINE_BREAK)
	let printedLines = printedValue.split(LINE_BREAK).slice(0, lines.length)

	return [...printedLines.slice(0, -1), printedLines.at(-1).slice(0, lines.at(-1).length)].join(`\n`)
}

/**
 * Gets what the declaration would hold in front of a function's closing parenthesis once the fix has run, spelled as the file spells it.
 * @param {import('postcss').Declaration} decl - The declaration the function stands in.
 * @param {string} declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param {FunctionNode} valueNode - The function whose closing parenthesis is being fixed.
 * @param {boolean} spellsInlineComments - False where the syntax the value was spelled in writes no comment with a double slash.
 * @returns {string} The text the parenthesis would stand behind, or an empty string where no comment can reach it.
 */
function beforeClosingString (decl, declValue, valueNode, spellsInlineComments) {
	let closingIndex = valueNode.sourceEndIndex - 1
	// The fix empties the whitespace the function keeps in front of the parenthesis and then every whitespace node behind it, stepping over the comments among them and stopping at anything else, so all of that closes up against the parenthesis on one line
	let emptiedIndex = closingIndex - valueNode.after.length

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type !== `comment` && node.type !== `space`) break

		emptiedIndex = node.sourceIndex
	}

	let raws = decl.raws
	let printedValue = (raws.value && raws.value.scss) || declValue
	let kept = printedBefore(printedValue, declValue, emptiedIndex)
	let standing = printedBefore(printedValue, declValue, closingIndex)

	// A comment already holding the parenthesis can take nothing new into itself, whatever the fix does with the whitespace, so such a value is left to the fix as it always was. The parenthesis is written back on the end for the asking, since the whitespace in front of it would otherwise be read as room a fix is about to write in, which is the question the other call asks. This one is answered the other way round as well: a comment wrongly taken for one holding the parenthesis lets a breaking fix through, while the other call only holds a safe fix back, so every break either syntax closes a comment on counts here, and only the breaks both of them close one on count there. Each syntax reads a break the other does not — Sass a form feed, Less the two separators of Unicode — so they are written as line feeds for the asking.
	if (endsWithInlineComment(`${standing.replaceAll(EVERY_COMMENT_CLOSING_BREAK, `\n`)})`, spellsInlineComments)) return ``

	// Closing the gap up can also bring a slash against a comment's own and open a comment that was never there, so what the fix would leave behind is what has to be looked at, not what stands. The parenthesis goes on the end here as well: the whitespace of the gap is gone by then, and whatever whitespace the fix does not empty — the value parser counts as space only what stands below the blank, so a separator of Unicode is a word to it — would otherwise be trimmed away with the line break it holds and the comment in front of it read as still open
	return `${kept}${standing.slice(kept.length).replaceAll(EVERY_WHITESPACE_RUN, ``)})`
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
			let hasFixed = false
			let declValue = getDeclarationValue(decl)
			// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
			let spellsInlineComments = readsInlineComments(decl, result)
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary nodes
			let inlineComments = findInlineCommentSpans(declValue, endsInlineCommentOnFormFeed(decl), spellsInlineComments)
			let parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				if (!isStandardSyntaxFunction(valueNode)) return

				let functionString = valueParser.stringify(valueNode)
				let isMultiLine = !isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
				let { before: checkBefore, firstIndex } = getCheckBefore(valueNode, declValue, inlineComments)

				if (primary === `always` && !containsNewline(checkBefore)) {
					fix = () => {
						hasFixed = true
						fixBeforeForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedOpening, openingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !containsNewline(checkBefore)) {
					fix = () => {
						hasFixed = true
						fixBeforeForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedOpeningMultiLine, openingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkBefore !== ``) {
					// The first argument goes right after this text, and the whitespace run the fix empties ends it. Where an inline comment stands there, the line break that run holds is what closes the comment, so the option cannot be satisfied without taking that argument, and everything the value has left, into the comment's text: leave the value alone and let the warning stand. A function holding nothing but comments is asked the same about its own closing parenthesis.
					let isOpeningFixable = !endsWithInlineComment(declValue.slice(0, firstIndex), spellsInlineComments)

					fix = isOpeningFixable
						? () => {
							hasFixed = true
							fixBeforeForNever(valueNode)
						}
						: null
					complain(messages.rejectedOpeningMultiLine, openingIndex)
				}

				// Check closing ...
				let closingIndex = valueNode.sourceIndex + functionString.length - 2
				let checkAfter = getCheckAfter(valueNode)

				if (primary === `always` && !containsNewline(checkAfter)) {
					fix = () => {
						hasFixed = true
						fixAfterForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedClosing, closingIndex)
				}

				if (isMultiLine && primary === `always-multi-line` && !containsNewline(checkAfter)) {
					fix = () => {
						hasFixed = true
						fixAfterForAlways(valueNode, context.newline || ``)
					}
					complain(messages.expectedClosingMultiLine, closingIndex)
				}

				if (isMultiLine && primary === `never-multi-line` && checkAfter !== ``) {
					// The parenthesis goes right after this text, and the whitespace run the fix empties ends it. Where an inline comment stands there, the line break that run holds is what closes the comment, so the fix would take the parenthesis, and the semicolon behind it, into the comment's text: leave the value alone and let the warning stand
					let isFixable = !endsWithInlineComment(beforeClosingString(decl, declValue, valueNode, spellsInlineComments), spellsInlineComments)

					fix = isFixable
						? () => {
							hasFixed = true
							fixAfterForNever(valueNode)
						}
						: null
					complain(messages.rejectedClosingMultiLine, closingIndex)
				}
			})

			if (hasFixed) setDeclarationValue(decl, parsedValue.toString())

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

/**
 * Checks if a string contains a newline character.
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string contains a newline, false otherwise.
 */
function containsNewline (/** @type {string} */ str) {
	return str.includes(`\n`)
}

/** @typedef {import('postcss-value-parser').FunctionNode} FunctionNode */

/**
 * Gets the whitespace before the first non-comment, non-space node in a function, and says where that node begins.
 *
 * A comment may stand between the parenthesis and the line break the `always` options ask for, so it is walked past and the whitespace behind it counted. `postcss-value-parser` knows nothing of a comment opened by a double slash and hands out two division signs and a word where one stands, so the nodes that make up such a comment are placed against the spans it occupies instead.
 *
 * Where the function holds nothing but comments and whitespace, the first significant thing is its own closing parenthesis, which is what the `never` fix would then pull up.
 * @param {FunctionNode} valueNode - The function node to check.
 * @param {string} declValue - The value the node was parsed from, which its positions count in.
 * @param {import('../../utils/findInlineCommentSpans/index.js').InlineCommentSpan[]} inlineComments - The spans the inline comments of the value occupy in it.
 * @returns {{ before: string, firstIndex: number }} The whitespace, and the index the first significant node begins at.
 */
function getCheckBefore (valueNode, declValue, inlineComments) {
	let before = valueNode.before
	let firstIndex = valueNode.sourceEndIndex - 1

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		let span = inlineComments.find(({ start, end }) => node.sourceIndex >= start && node.sourceIndex < end)

		if (span) {
			// The value parser hangs the whitespace behind a node on that node rather than emitting a node of its own for it, so the break closing the comment reaches past the comment's end whenever the last thing it spells is a division sign, a colon or a comma. It is whitespace of the value like any other, and the walk would drop it with the node it hangs on.
			if (node.sourceEndIndex > span.end) before += declValue.slice(span.end, node.sourceEndIndex)

			continue
		}

		if (node.type === `space`) {
			before += node.value
			continue
		}

		firstIndex = node.sourceIndex
		break
	}

	return { before, firstIndex }
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
 * Fixes the whitespace before the first node for the 'always' expectation.
 * @param {FunctionNode} valueNode - The function node to fix.
 * @param {string} newline - The newline character to use.
 */
function fixBeforeForAlways (valueNode, newline) {
	let target

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			target = node
			continue
		}

		break
	}

	if (target) target.value = newline + target.value
	else valueNode.before = newline + valueNode.before
}

/**
 * Fixes the whitespace before the first node for the 'never' expectation.
 * @param {FunctionNode} valueNode - The function node to fix.
 */
function fixBeforeForNever (valueNode) {
	valueNode.before = ``

	for (let node of valueNode.nodes) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			node.value = ``
			continue
		}

		break
	}
}

/**
 * Fixes the whitespace after the last node for the 'always' expectation.
 * @param {FunctionNode} valueNode - The function node to fix.
 * @param {string} newline - The newline character to use.
 */
function fixAfterForAlways (valueNode, newline) {
	valueNode.after = newline + valueNode.after
}

/**
 * Fixes the whitespace after the last node for the 'never' expectation.
 * @param {FunctionNode} valueNode - The function node to fix.
 */
function fixAfterForNever (valueNode) {
	valueNode.after = ``

	for (let node of [...valueNode.nodes].toReversed()) {
		if (node.type === `comment`) continue

		if (node.type === `space`) {
			node.value = ``
			continue
		}

		break
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
