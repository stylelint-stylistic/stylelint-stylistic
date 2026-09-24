import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import type { InlineCommentReading, Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { editsOpenNoComment } from "../../utils/editsOpenNoComment/index.ts"
import { type CommentSpan, findCommentSpanAt, findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideParenthesesInUrlStrings } from "../../utils/hideParenthesesInUrlStrings/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import { quotesItsAddress } from "../../utils/quotesItsAddress/index.ts"
import { report } from "../../utils/report/index.ts"
import { editsRereadAnAddress } from "../../utils/rereadsAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { splitSpaceNodesAtWords } from "../../utils/splitSpaceNodesAtWords/index.ts"

let { utils: { validateOptions } } = stylelint

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

/**
 * Asks whether the function the value parser returned is one the file writes.
 *
 * No for a preprocessor construct, an unclosed function, or one closed on a `)` inside a `//` comment, which the parser cannot see: a `/*` in one swallows every `)` behind it, a `)` in one closes the call early, and the fix guards see neither. The whole node is refused: the closing `)` is one the parser never returns.
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
 * The closing `)`'s index, from the node's end: a printed copy prints `/*\/` as `/**\/` and was a character off.
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

/** `always` a single space inside the parentheses, `never` no whitespace; the `-single-line` forms in a single-line function only. */
export type PrimaryOption = `always` | `never` | `always-single-line` | `never-single-line`

/** The whitespace each option asks for on either side. */
const ASKED: Record<PrimaryOption, string> = {
	"always": ` `,
	"never": ``,
	"always-single-line": ` `,
	"never-single-line": ``,
}

/** The message each option reports a side with, the `(` first. */
const SIDE_MESSAGES: Record<PrimaryOption, [keyof typeof MESSAGES, keyof typeof MESSAGES]> = {
	"always": [`expectedOpening`, `expectedClosing`],
	"never": [`rejectedOpening`, `rejectedClosing`],
	"always-single-line": [`expectedOpeningSingleLine`, `expectedClosingSingleLine`],
	"never-single-line": [`rejectedOpeningSingleLine`, `rejectedClosingSingleLine`],
}

/**
 * Requires a single space or disallows whitespace inside the parentheses of functions.
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
			// Both kinds: a `//` comment's text comes back as words and calls, a `/*/` comment closes on its own star
			let comments = syntax.commentSpans(declValue, decl, result)
			// Masks quotation marks a comment leaves open, so the parser pairs them right
			let parsedValue = valueParser(hideParenthesesInUrlStrings(hideQuotesInComments(declValue, comments), comments))

			// The value parser calls a control character such as a vertical tab whitespace where the tokenizer calls it a word, and both fixes rewrite a whole side
			splitSpaceNodesAtWords(parsedValue.nodes)

			parsedValue.walk((valueNode, at, siblings) => {
				if (valueNode.type !== `function`) return

				// The parentheses of a call opening an address are the address's: a space or a break written behind the `(` parts a bare address from the parenthesis, which is what a tokenizer reads one token by, and `postcss-scss` reads a quoted one behind such a space as a token counting parentheses, which a string holding one leaves unclosed. Passed over, and the walk goes no further in where the address is bare, as it does in the four rules that ask this question of a node they would otherwise read inside; behind a quoted address stand arguments, whose calls are walked. The name is the file's spelling rather than the parser's, which is wider than what a parser takes a url token by.
				if (opensAnAddress(valueNode, at, siblings)) return quotesItsAddress(valueNode) ? undefined : false

				// A narrowing here is not carried into a nested function
				let functionNode = valueNode

				// A call in a comment is none; one nested in it is still walked, since one opened in a `//` comment reaches past its closing break
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				// The `-single-line` forms ask nothing of a function broken over lines
				let asked = primary.endsWith(`-single-line`) && !isSingleLineString(functionString) ? undefined : ASKED[primary]
				let [openingMessage, closingMessage] = SIDE_MESSAGES[primary]

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				/**
				 * Asks whether the fix may write the run behind the `(`. Under a parser whose tokenizer reads the parentheses behind `url(` as one token, a write opening a comment, as taking away the whitespace in front of a quotation mark there does, is refused; outside it the question is not asked, since a name glued to a sign, `1!url(`, is an address to the walk and a call to the parser, and a refusal there would take away a write the parser reads the same. A write switching how the tokenizer reads parentheses it takes for an address's is refused as well: this run holds the character that decides it, and the name the parser reads there is not the one the walk read. Whether the break the run holds closes a `//` comment is not asked: the `(` would stand in that comment's text, and the walk turns such a call away before the question is put.
				 * @param write - The whitespace the fix writes.
				 * @returns True if no comment opens where that question is asked and the parentheses keep their reading.
				 */
				function isOpeningFixable (write: string): boolean {
					return (!reading.tokenizes || editsOpenNoComment(declValue, [openingEdit(functionNode, write)], reading)) && !editsRereadAnAddress(declValue, openingIndex - 1, [openingEdit(functionNode, write)], reading)
				}

				if (asked !== undefined && valueNode.before !== asked) {
					fix = fixBehind(() => isOpeningFixable(asked), () => openingEdit(valueNode, asked))
					complain(messages[openingMessage], openingIndex)
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

				if (asked !== undefined && valueNode.after !== asked) {
					fix = fixBehind(isClosingFixable, () => closingEdit(valueNode, asked))
					complain(messages[closingMessage], closingIndex)
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
