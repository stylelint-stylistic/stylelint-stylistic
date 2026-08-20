import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

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

/** The line breaks a value is counted in, each of them one character long. A form feed is among them: Sass ends an inline comment on it, so code can follow one on the line a line feed counts, and without it the copies fall out of step there and a fix is declined for nothing. No case pins any of this — neither the members, nor the join, nor the slice that cuts the last line: the only syntax the mapping tells apart is the one whose write is discarded before it reaches the file (#115), so the fixes it saves cannot be asserted until that is repaired. What the mapping must not do reaches the file, and is pinned: where the two copies are one and the same text it is not run at all. */
let lineBreak = /[\n\r\f]/u

/** Every break that closes an inline comment anywhere but in both syntaxes at once: a form feed, which Sass ends a comment on and Less does not, and the two separators of Unicode, which one reading of Less's own parser ends one on though neither syntax the plugin runs under does. The question they are counted for is the one whose wrong answer lets a breaking fix through, so a break is counted there as soon as anything reads it as one — the form feed because a fix does break through it, the separators because nothing but the value parser's own reading of what a space is keeps them from it. */
let closingBreak = /[\f\u2028\u2029]/gu

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
	let lines = before.split(lineBreak)
	let printedLines = printedValue.split(lineBreak).slice(0, lines.length)

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
	let raws = decl.raws
	let printedValue = (raws.value && raws.value.scss) || declValue
	// The fix writes the whitespace the function keeps in front of the parenthesis and nothing else, so everything behind that whitespace stays on the line it is written on, and only the parenthesis moves
	let kept = printedBefore(printedValue, declValue, closingIndex - valueNode.after.length)
	let standing = printedBefore(printedValue, declValue, closingIndex)

	// A comment already holding the parenthesis can take nothing new into itself, whatever the fix writes in place of that whitespace, so such a value is left to the fix as it always was. The parenthesis is written back on the end for both askings. `endsWithInlineComment` reads trailing whitespace as room a fix is about to write in, which is the question its other callers ask and the opposite of this one, and the value parser counts as space only what stands below the blank, so a separator of Unicode survives the fix as a word — trimmed away with the line break it holds, it would leave the comment in front of it read as still open.
	// The two askings read a line break differently as well. Taking a comment for one that already holds the parenthesis lets a breaking fix through, while taking one for still open at the end only holds a safe fix back, so the first counts every break anything reads as one and the second only the breaks both syntaxes do.
	if (endsWithInlineComment(`${standing.replaceAll(closingBreak, `\n`)})`, spellsInlineComments)) return ``

	// A single space is all the `always` options put there, and a space closes no comment, so both options leave the parenthesis standing behind the same text
	return `${kept})`
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

				if (!isStandardSyntaxFunction(valueNode)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				let isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				if (primary === `always` && valueNode.before !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.before = ` `
					}
					complain(messages.expectedOpening, openingIndex)
				}

				if (primary === `never` && valueNode.before !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.before = ``
					}
					complain(messages.rejectedOpening, openingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.before !== ` `) {
					fix = () => {
						hasFixed = true
						valueNode.before = ` `
					}
					complain(messages.expectedOpeningSingleLine, openingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.before !== ``) {
					fix = () => {
						hasFixed = true
						valueNode.before = ``
					}
					complain(messages.rejectedOpeningSingleLine, openingIndex)
				}

				// Check closing ...
				let closingIndex = valueNode.sourceIndex + functionString.length - 2

				/**
				 * Asks whether the parenthesis can be moved at all.
				 *
				 * The parenthesis goes right after the text this reads, and the whitespace the fix overwrites ends it. Where an inline comment stands there, the line break that whitespace holds is what closes the comment, so no option can be satisfied without taking the parenthesis, and everything the declaration has left, into the comment's text: leave the value alone and let the warning stand. The single-line options ask as well — `isSingleLineString` reads a line feed and a carriage return and nothing else, so a function whose only break is a form feed passes for a single line while Sass ends an inline comment on it all the same, and such a function meets a comment the options were held to be out of reach of.
				 *
				 * Only one option is ever in force, so this is asked once at most, and only where a problem has been found: reading the whole value in front of the parenthesis is not work to do for a function nothing is the matter with.
				 * @returns {boolean} True if the fix can write without commenting the parenthesis out.
				 */
				function isClosingFixable () {
					// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: holding a fix back over a comment that is not there refuses a write nothing is the matter with
					let spellsInlineComments = readsInlineComments(decl, result)

					return !endsWithInlineComment(beforeClosingString(decl, declValue, valueNode, spellsInlineComments), spellsInlineComments)
				}

				if (primary === `always` && valueNode.after !== ` `) {
					fix = isClosingFixable()
						? () => {
							hasFixed = true
							valueNode.after = ` `
						}
						: null
					complain(messages.expectedClosing, closingIndex)
				}

				if (primary === `never` && valueNode.after !== ``) {
					fix = isClosingFixable()
						? () => {
							hasFixed = true
							valueNode.after = ``
						}
						: null
					complain(messages.rejectedClosing, closingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.after !== ` `) {
					fix = isClosingFixable()
						? () => {
							hasFixed = true
							valueNode.after = ` `
						}
						: null
					complain(messages.expectedClosingSingleLine, closingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.after !== ``) {
					fix = isClosingFixable()
						? () => {
							hasFixed = true
							valueNode.after = ``
						}
						: null
					complain(messages.rejectedClosingSingleLine, closingIndex)
				}
			})

			if (hasFixed) setDeclarationValue(decl, parsedValue.toString())

			/**
			 * Reports a parentheses space violation.
			 * @param {string} message - The error message to report.
			 * @param {number} offset - The offset index of the violation.
			 */
			function complain (message, offset) {
				const problemIndex = declarationValueIndex(decl) + offset

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
