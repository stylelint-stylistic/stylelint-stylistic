import valueParser, { type FunctionNode } from "postcss-value-parser"
import stylelint, { type FixCallback } from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpanAt, findInlineCommentSpanHolding, findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import { movesEndIntoInlineComment } from "../../utils/movesEndIntoInlineComment/index.ts"
import { type InlineCommentReading, inlineCommentReading } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"

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

/** A character put where the first argument of a function begins, so that the guard reading the text in front of it is answered about that position and not about the whitespace the fix would write over. Any character that opens nothing and that `String.prototype.trimEnd` leaves standing answers the same, and the argument's own first character is not one of those: the value parser counts as space only what stands below the blank, so a separator of Unicode standing there is a character of the argument, and the scan behind the guard would trim it away together with the line break in front of it and read the comment as still open. */
const ARGUMENT_STAND_IN = `x`

/**
 * Asks whether the file spells the function the value parser has handed back.
 *
 * A preprocessor construct is none, and neither is a function the parser has marked unclosed. The parser knows nothing of a comment opened by a double slash, so a `/*` standing in the text of one opens a block comment to it that never closes and swallows the closing parenthesis of every function open around it. The stringifier then prints what such a node keeps in front of its parenthesis behind it instead, so the whitespace an `always` option asks for there lands outside the function; PostCSS trims that whitespace out of the value and into the raws of what follows, which leaves the value looking untouched to the next run, and the next run writes another one — a character a run, for as long as the fixer is asked (#131).
 *
 * A function the parser closed on a parenthesis standing inside such a comment is none the file spells either, and is the third question. The parser closes a call on the first parenthesis it meets, and the text of a comment is text it reads as code, so `f(1px // c) h(2px` and a break and `2px)` — one call of `f` reaching over that break, as every syntax spelling such a comment reads it — comes back as a closed `f(1px // c)` with an `h(2px` and the break and `2px)` beside it. Neither parenthesis the parser gives that `f` is one the file writes, and the whitespace an `always` option asks for in front of the second lands inside the comment's text, while a `never` option takes away a space that text holds (#320).
 *
 * The two guards standing in front of the fixes answer nothing here. They ask whether a fix would take something from outside a comment into one, and this parenthesis is inside one on both sides of the fix — which #132 lets through on purpose, a value already broken that way being one the fix leaves no worse. That reasoning holds for a parenthesis the file really spells and not for one the parser invented.
 *
 * Half the node is no answer, though the halves are not alike. The opening parenthesis of such a call is one the file really writes, and so is the whitespace behind it, so the opening half of an option could be read and fixed where it stands. The closing half could not: the parenthesis the file closes the call on is one the parser never hands over, so whether the option is satisfied there is a question the rule cannot put at all. Sometimes it already is — the last parenthesis of `f(1px // c) h( 2px`, a break, `2px )` has the space an `always` option wants in front of it, the file reading `f(1px` and the break and `2px )` — and sometimes it is not, as in `f(1px // c) h(2px`, a break and `2px)`. A rule keeping the opening half would write its whitespace and report the problem solved in both, and in the second it would hand back a value still violating the option at a parenthesis no run can ever reach, which is the shape #285 is about. Nothing the rule can see tells the two apart, so reporting nothing is the honest answer, and the warnings that costs are the price of a parse it cannot mend.
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
 * Asks whether the fix would take a function's first argument from outside an inline comment into one.
 *
 * The fix writes the whitespace the function keeps behind its opening parenthesis and nothing else, so everything in front of that parenthesis stays where it is written and the argument closes up against it. Where an inline comment stands in front of the whitespace, the line break that whitespace holds is what closes the comment, so taking the break away leaves the argument, and everything the declaration has behind it, inside the comment's text.
 *
 * The stand-in stands where the argument's first character does, since {@link movesEndIntoInlineComment} asks about the character a text ends with.
 * @param declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param valueNode - The function whose opening parenthesis is being fixed.
 * @param reading - What the syntax the value was spelled in makes of a comment opened by a double slash.
 * @returns True where a reading has the argument move into a comment.
 */
function movesOpeningIntoComment (declValue: string, valueNode: FunctionNode, reading: InlineCommentReading): boolean {
	let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1
	let firstIndex = openingIndex + valueNode.before.length
	let standingText = declValue.slice(0, firstIndex)
	// The fix writes the whitespace behind the parenthesis and nothing else, so everything in front of that parenthesis stays where it is written and the argument closes up against it. A single space is all the `always` options put there, and a space closes no comment, so both options leave the argument standing behind the same text.
	let fixedText = declValue.slice(0, openingIndex)

	return movesEndIntoInlineComment(`${standingText}${ARGUMENT_STAND_IN}`, `${fixedText}${ARGUMENT_STAND_IN}`, reading)
}

/**
 * Asks whether the fix would take a function's closing parenthesis from outside an inline comment into one.
 *
 * The fix writes the whitespace the function keeps in front of that parenthesis and nothing else, so the line break standing in that whitespace — the one closing a comment the value left open — is exactly what it takes away.
 * @param declValue - The value the rule has read and parsed, which the node's positions count in.
 * @param valueNode - The function whose closing parenthesis is being fixed.
 * @param reading - What the syntax the value was spelled in makes of a comment opened by a double slash.
 * @returns True where a reading has the parenthesis move into a comment.
 */
function movesClosingIntoComment (declValue: string, valueNode: FunctionNode, reading: InlineCommentReading): boolean {
	let closingIndex = valueNode.sourceEndIndex - 1
	let standingText = declValue.slice(0, closingIndex)
	// The fix writes the whitespace the function keeps in front of the parenthesis and nothing else, so everything behind that whitespace stays on the line it is written on, and only the parenthesis moves. A single space is all the `always` options put there, and a space closes no comment, so both options leave the parenthesis standing behind the same text.
	let fixedText = declValue.slice(0, closingIndex - valueNode.after.length)

	// The parenthesis is written back on the end of each text, since it is the character the fix moves
	return movesEndIntoInlineComment(`${standingText})`, `${fixedText})`, reading)
}

/**
 * Names the span the whitespace behind a function's opening parenthesis stands in, and what goes there.
 *
 * The span is counted in the value the file spells, so that the fix is written where the whitespace stands rather than printed back as the whole value.
 * @param valueNode - The function being fixed.
 * @param text - The whitespace to put there.
 * @returns The edit that writes it.
 */
function openingEdit (valueNode: FunctionNode, text: string): Edit {
	let start = valueNode.sourceIndex + valueNode.value.length + 1

	return { start, end: start + valueNode.before.length, text }
}

/**
 * Names the span the whitespace in front of a function's closing parenthesis stands in, and what goes there.
 *
 * A function the parser has marked unclosed never gets here, so the parenthesis is the character the node ends on.
 * @param valueNode - The function being fixed.
 * @param text - The whitespace to put there.
 * @returns The edit that writes it.
 */
function closingEdit (valueNode: FunctionNode, text: string): Edit {
	let end = valueNode.sourceEndIndex - 1

	return { start: end - valueNode.after.length, end, text }
}

/**
 * Requires a single space or disallows whitespace on the inside of the parentheses of functions.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never`, `always-single-line` and `never-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
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
			// What a fix changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
			let edits: Edit[] = []
			let declValue = getDeclarationValue(decl)
			// A double slash spells a comment only where the syntax says one, and a file of plain CSS spells none: the pair in `myurl(//a)` is code there, and taking it for a comment would silence everything standing behind it on the line
			let reading = inlineCommentReading(decl, result)
			// A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind: what such a comment holds comes back as ordinary words and calls
			let inlineComments = findInlineCommentSpans(declValue, reading.spells)
			let parsedValue = valueParser(declValue)

			parsedValue.walk((valueNode) => {
				if (valueNode.type !== `function`) return

				// The node narrowed to a call, under a name the closures below can read it by: a narrowing made in this callback is not carried into a function created inside it
				let functionNode = valueNode

				// A call standing in the text of an inline comment is no call of the value, and its parentheses are none of this rule's: leave it alone. A call nested inside it is still walked and asked the same question, since one opened inside such a comment reaches past the break that closes it and gathers code the file spells.
				if (findInlineCommentSpanHolding(valueNode, inlineComments)) return

				if (!isFunctionParsedAsWritten(syntax, valueNode, inlineComments)) return

				// Ignore function without parameters
				if (valueNode.nodes.length === 0) return

				let functionString = valueParser.stringify(valueNode)
				let isSingleLine = isSingleLineString(functionString)

				// Check opening ...
				let openingIndex = valueNode.sourceIndex + valueNode.value.length + 1

				/**
				 * Asks whether the whitespace behind the opening parenthesis can be written at all.
				 *
				 * The first argument goes right after that whitespace, and the fix writes over the whitespace itself. Where an inline comment stands in front of it, the line break it holds is what closes the comment, so no option can be satisfied without taking the argument, and everything the declaration has behind it, into the comment's text: leave the value alone and let the warning stand, as the closing parenthesis has done since #114. The single-line options ask as well, cheaply and for safety's sake rather than against a shape any case pins: a function this rule counts as single-line holds no line feed for a comment of that kind to end on, and the text in front of its first argument would have to be left open by something standing outside the function itself.
				 *
				 * Only one option is ever in force, so this is asked once at most, and only where a problem has been found: reading the whole value in front of the argument, four times over, is not work to do for a function nothing is the matter with.
				 * @returns True if the fix can write without commenting the first argument out.
				 */
				function isOpeningFixable (): boolean {
					return !movesOpeningIntoComment(declValue, functionNode, reading)
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
				let closingIndex = valueNode.sourceIndex + functionString.length - 2

				/**
				 * Asks whether the parenthesis can be moved at all.
				 *
				 * The parenthesis goes right after the text this reads, and the whitespace the fix overwrites ends it. Where an inline comment stands there, the line break that whitespace holds is what closes the comment, so no option can be satisfied without taking the parenthesis, and everything the declaration has left, into the comment's text: leave the value alone and let the warning stand. The single-line options ask as well, cheaply and for safety's sake rather than against a shape any case pins: a function this rule counts as single-line holds no line feed for a comment of that kind to end on, and the text in front of its parenthesis would have to be left open by something standing outside the function itself.
				 *
				 * Only one option is ever in force, so this is asked once at most, and only where a problem has been found: reading the whole value in front of the parenthesis, four times over, is not work to do for a function nothing is the matter with.
				 * @returns True if the fix can write without commenting the parenthesis out.
				 */
				function isClosingFixable (): boolean {
					return !movesClosingIntoComment(declValue, functionNode, reading)
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

			if (edits.length > 0) setDeclarationValue(decl, applyEditsFromEnd(declValue, edits))

			/**
			 * Hands `report` the fix for a write, or nothing at all where the guard standing in front of that write has turned it down.
			 *
			 * Stylelint reads the absence of a callback as the answer that the problem cannot be fixed, so the warning stands and the value is left exactly as it is.
			 *
			 * No two writes of this rule ever name one span: a function whose parentheses hold nothing but whitespace is the only shape where the two sides of an option are the same span of the value, and such a function is turned away above for holding no arguments.
			 * @param isFixable - The guard the write stands behind, asked here and nowhere else, so that it is asked once and only where a problem has been found.
			 * @param write - The span the write changes, and what goes there.
			 * @returns The fix, or nothing.
			 */
			function fixBehind (isFixable: () => boolean, write: () => Edit): (() => void) | undefined {
				if (!isFixable()) return

				return () => {
					edits.push(write())
				}
			}

			/**
			 * Reports a parentheses space violation.
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

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
