import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `function-parentheses-space-inside`

const MESSAGES = defineMessages({
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

/** Stands in for the first argument, which may open on a Unicode separator `trimEnd` would strip with the break in front of it. */
const ARGUMENT_STAND_IN = `x`

/**
 * Asks whether the function the value parser returned is one the file writes.
 *
 * No for a preprocessor construct, an unclosed function, or one closed on a `)` inside a `//` comment, which the parser cannot see: a `/*` in one swallows every `)` behind it ([#131](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131)), a `)` in one closes the call early ([#320](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320)), and the fix guards see neither ([#132](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/132)). The whole node is refused: the closing `)` is one the parser never returns ([#285](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/285)).
 * @param syntax - The syntax the rule is built over.
 * @param valueNode - The function.
 * @param comments - The value's comment spans.
 * @returns True where the parentheses may be written.
 */
function isFunctionParsedAsWritten (syntax: Syntax, valueNode: FunctionNode, comments: CommentSpan[]): boolean {
	if (!syntax.isStandardFunction(valueNode)) return false

	if (valueNode.unclosed) return false

	// After `unclosed`: an unclosed node's end index is no `)`
	return !findCommentSpanAt(valueNode.sourceEndIndex - 1, comments)
}

/**
 * Asks whether the fix puts the first argument into a `//` comment the line break behind the `(` closes. The stand-in replaces the argument: {@link movesEndIntoInlineComment} reads a text's last character.
 * @param syntax - The syntax the rule is built over.
 * @param declValue - The whole value the function stands in.
 * @param valueNode - The function.
 * @param reading - The `//` comment reading.
 * @returns True where the argument lands in a comment.
 */
function movesOpeningIntoComment (syntax: Syntax, declValue: string, valueNode: FunctionNode, reading: InlineCommentReading): boolean {
	let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
	let firstIndex = openingIndex + valueNode.before.length
	let standingText = declValue.slice(0, firstIndex)
	// Same for both options: a single space closes no comment
	let fixedText = declValue.slice(0, openingIndex)

	return syntax.movesEndIntoInlineComment(`${standingText}${ARGUMENT_STAND_IN}`, `${fixedText}${ARGUMENT_STAND_IN}`, reading)
}

/**
 * Asks whether the fix puts the `)` into a `//` comment the line break in front of it closes.
 * @param syntax - The syntax the rule is built over.
 * @param declValue - The whole value the function stands in.
 * @param valueNode - The function.
 * @param reading - The `//` comment reading.
 * @returns True where the `)` lands in a comment.
 */
function movesClosingIntoComment (syntax: Syntax, declValue: string, valueNode: FunctionNode, reading: InlineCommentReading): boolean {
	let closingIndex = valueNode.sourceEndIndex - 1
	let standingText = declValue.slice(0, closingIndex)
	// Same for both options: a single space closes no comment
	let fixedText = declValue.slice(0, closingIndex - valueNode.after.length)

	// Each text ends on the `)` the fix moves
	return syntax.movesEndIntoInlineComment(`${standingText})`, `${fixedText})`, reading)
}

/**
 * The edit rewriting the whitespace behind a function's `(`.
 * @param valueNode - The function.
 * @param text - The whitespace to write.
 * @returns The edit.
 */
function openingEdit (valueNode: FunctionNode, text: string): Edit {
	let start = valueNode.sourceIndex + valueNode.value.length + 1

	return { start, end: start + valueNode.before.length, text }
}

/**
 * The closing `)`'s index, from the node's end: a printed copy prints `/*\/` as `/**\/` and was a character off ([#506](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/506)).
 * @param valueNode - The function.
 * @returns The index.
 */
function closingParenthesisIndex (valueNode: FunctionNode): number {
	return valueNode.sourceEndIndex - 1
}

/**
 * The edit rewriting the whitespace in front of a function's `)`.
 * @param valueNode - The function.
 * @param text - The whitespace to write.
 * @returns The edit.
 */
function closingEdit (valueNode: FunctionNode, text: string): Edit {
	let end = closingParenthesisIndex(valueNode)

	return { start: end - valueNode.after.length, end, text }
}

/**
 * Requires a single space or disallows whitespace inside the parentheses of functions.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - `always`, `never`, `always-single-line` or `never-single-line`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line` | `never-single-line`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`, `never-single-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!decl.value.includes(`(`)) return

			let fix: FixCallback | undefined
			// Edited at positions: the value parser prints `/*/` as `/**/`
			let edits: Edit[] = []
			let declValue = syntax.read(decl)
			// A `//` is a comment only where the syntax says: `myurl(//a)` is CSS
			let reading = syntax.inlineComments(decl, result)
			// Both kinds: a `//` comment's text comes back as words and calls, a `/*/` comment closes on its own star (#378)
			let comments = syntax.commentSpans(declValue, decl, result)
			// Masks quotation marks a comment leaves open, so the parser pairs them right (#508)
			let parsedValue = valueParser(hideQuotesInComments(declValue, comments))

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				// A narrowing here is not carried into a nested function
				let functionNode = valueNode

				// A call in a comment is none; one nested in it is still walked, since one opened in a `//` comment reaches past its closing break
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				let isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				/**
				 * Asks whether the line break behind the `(` closes a `//` comment, which no option can satisfy without commenting the argument out; the warning then stands unfixed ([#114](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114)).
				 * @returns True if the argument stays outside a comment.
				 */
				function isOpeningFixable (): boolean {
					return !movesOpeningIntoComment(syntax, declValue, functionNode, reading)
				}

				if (primary === `always` && valueNode.before !== ` `) {
					fix = fixBehind(isOpeningFixable, () => openingEdit(valueNode, ` `))
					complain(messages.expectedOpening, openingIndex)
				}

				if (primary === `never` && valueNode.before !== ``) {
					fix = fixBehind(isOpeningFixable, () => openingEdit(valueNode, ``))
					complain(messages.rejectedOpening, openingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.before !== ` `) {
					fix = fixBehind(isOpeningFixable, () => openingEdit(valueNode, ` `))
					complain(messages.expectedOpeningSingleLine, openingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.before !== ``) {
					fix = fixBehind(isOpeningFixable, () => openingEdit(valueNode, ``))
					complain(messages.rejectedOpeningSingleLine, openingIndex)
				}

				// Check closing ...
				// The character in front of the `)`
				let closingIndex = closingParenthesisIndex(valueNode) - 1

				/**
				 * Asks whether the line break in front of the `)` closes a `//` comment, which no option can satisfy without commenting it out; the warning then stands unfixed.
				 * @returns True if the `)` stays outside a comment.
				 */
				function isClosingFixable (): boolean {
					return !movesClosingIntoComment(syntax, declValue, functionNode, reading)
				}

				if (primary === `always` && valueNode.after !== ` `) {
					fix = fixBehind(isClosingFixable, () => closingEdit(valueNode, ` `))
					complain(messages.expectedClosing, closingIndex)
				}

				if (primary === `never` && valueNode.after !== ``) {
					fix = fixBehind(isClosingFixable, () => closingEdit(valueNode, ``))
					complain(messages.rejectedClosing, closingIndex)
				}

				if (isSingleLine && primary === `always-single-line` && valueNode.after !== ` `) {
					fix = fixBehind(isClosingFixable, () => closingEdit(valueNode, ` `))
					complain(messages.expectedClosingSingleLine, closingIndex)
				}

				if (isSingleLine && primary === `never-single-line` && valueNode.after !== ``) {
					fix = fixBehind(isClosingFixable, () => closingEdit(valueNode, ``))
					complain(messages.rejectedClosingSingleLine, closingIndex)
				}
			})

			if (edits.length > 0) syntax.write(decl, applyEditsFromEnd(declValue, edits))

			/**
			 * Returns the fix, or nothing where the guard refuses, which Stylelint reports as unfixable. No two writes name one span, an argumentless function being refused above.
			 * @param isFixable - The guard, asked once.
			 * @param write - The edit.
			 * @returns The fix, or nothing.
			 */
			function fixBehind (isFixable: () => boolean, write: () => Edit): (() => void) | undefined {
				if (!isFixable()) return

				return () => {
					edits.push(write())
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
