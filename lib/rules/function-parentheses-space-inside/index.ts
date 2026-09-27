import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint from "stylelint"

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
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { splitSpaceNodesAtWords } from "../../utils/splitSpaceNodesAtWords/index.ts"
import { type WriteCandidate, writesKeepingAddresses } from "../../utils/writesKeepingAddresses/index.ts"

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
 * Asks whether a `//` comment the syntax closes stands inside a function, which ends a line to the language wherever it closes.
 * @param valueNode - The function.
 * @param comments - The value's comment spans.
 * @returns True where such a comment closes short of the function's `)`.
 */
function closesAnInlineComment (valueNode: FunctionNode, comments: CommentSpan[]): boolean {
	return comments.some(({ start, end, isInline }) => isInline && start > valueNode.sourceIndex && end < valueNode.sourceEndIndex - 1)
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

			// Edited at positions: the value parser prints `/*/` as `/**/`
			let edits: Edit[] = []
			// Reported once the walk is done: a write into a call's parentheses can switch which word a later `(` pops, and so whether it opens an address's token, which is asked of every write the run gives together
			let problems: (WriteCandidate & { message: string })[] = []
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

				// The parentheses of a bare address are the address's: a space or a break written behind the `(` parts it from the parenthesis, which is what a tokenizer reads one token by, so the call is passed over and the walk goes no further in. A quoted address's parentheses are the call's own and are checked like any call's, the write behind the `(` asked once the walk is done whether it switches how the tokenizer reads them, since `postcss-scss` reads a quoted address behind a space as a token counting parentheses, which a string holding an unpaired one leaves unclosed or closes early. The name is the file's spelling rather than the parser's, which is wider than what a parser takes a url token by.
				if (opensAnAddress(valueNode, at, siblings) && !quotesItsAddress(valueNode)) return false

				// A narrowing here is not carried into a nested function
				let functionNode = valueNode

				// A call in a comment is none; one nested in it is still walked, since one opened in a `//` comment reaches past its closing break
				if (findCommentSpanHolding(valueNode, comments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, comments)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				// The `-single-line` forms ask nothing of a function broken over lines, and a `//` comment the language closes inside it breaks its line wherever PostCSS counts none, on a bare carriage return, or under Sass a form feed
				let asked = primary.endsWith(`-single-line`) && (!isSingleLineString(functionString) || closesAnInlineComment(valueNode, comments)) ? undefined : ASKED[primary]
				let [openingMessage, closingMessage] = SIDE_MESSAGES[primary]

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				/**
				 * Asks whether the fix may write the run behind the `(`. Under a parser whose tokenizer reads the parentheses behind `url(` as one token, a write opening a comment, as taking away the whitespace in front of a quotation mark there does, is refused; outside it the question is not asked, since a name glued to a sign, `1!url(`, is an address to the walk and a call to the parser, and a refusal there would take away a write the parser reads the same. Whether the write switches how the tokenizer reads parentheses it takes for an address's is asked once the walk is done, along with every other write the run gives: this run holds the character that decides it for this call, and a break taken out of it or written elsewhere in the run can decide it for a later one. Whether the break the run holds closes a `//` comment is not asked: the `(` would stand in that comment's text, and the walk turns such a call away before the question is put.
				 * @param write - The whitespace the fix writes.
				 * @returns True if no comment opens where that question is asked.
				 */
				function isOpeningFixable (write: string): boolean {
					return !reading.tokenizes || editsOpenNoComment(declValue, [openingEdit(functionNode, write)], reading)
				}

				if (asked !== undefined && valueNode.before !== asked) complain(messages[openingMessage], openingIndex, isOpeningFixable(asked) ? openingEdit(valueNode, asked) : undefined)

				// Check closing ...
				// The character in front of the `)`
				let closingIndex = closingParenthesisIndex(valueNode) - 1

				// A line break in front of the `)` closing a `//` comment is one no option can satisfy without commenting it out, and the warning then stands unfixed; taking out the last break inside the parentheses can make them one plain token, which is asked with every write of the run once the walk is done
				if (asked !== undefined && valueNode.after !== asked) complain(messages[closingMessage], closingIndex, movesClosingIntoComment(syntax, declValue, functionNode, reading) ? undefined : closingEdit(valueNode, asked))
			})

			// Every write the run gives together is asked whether it switches how the tokenizer reads parentheses it takes for an address's: a run written behind the `(` of one, or a last break taken out of parentheses, which makes them one plain token pushing none of the words inside, so that a later `(` pops `url` where it popped another word
			let given = writesKeepingAddresses(declValue, problems, reading, decl, result, ruleName)

			// No two writes name one span, an argumentless function being refused above
			for (let [problemIndex, { message, index, edits: write }] of problems.entries()) {
				let fix = write && given[problemIndex] ? (): void => { edits.push(...write) } : undefined

				report({ ruleName, result, message, node: decl, index, endIndex: index, ...(fix && { fix }) })
			}

			if (edits.length > 0) syntax.write(decl, applyEditsFromEnd(declValue, edits))

			/**
			 * Files a violation with the fix the guards leave it, to be reported once the walk is done.
			 * @param message - The warning text to report.
			 * @param offset - The index in the value.
			 * @param write - The edit, or nothing where a guard refuses it.
			 */
			function complain (message: string, offset: number, write: Edit | undefined): void {
				problems.push({ message, index: declarationValueIndex(decl) + offset, edits: write && [write] })
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
