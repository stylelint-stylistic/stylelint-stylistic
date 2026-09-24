import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { GRID_AREAS_PROPERTY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { type CommentSpan, findEscapeSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { gridTableLines, type Span } from "../../utils/gridTableLines/index.ts"
import { isWhitespace } from "../../utils/isWhitespace/index.ts"
import { maskEscapes } from "../../utils/maskEscapes/index.ts"
import { neighborCopies } from "../../utils/neighborSettings/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `no-multiple-whitespaces`

const MESSAGES = defineMessages({
	rejected: `Unexpected multiple whitespace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The rule padding a grid shorthand's rows into columns under `alignColumns`, whose runs are then its own. */
const GRID_ALIGNMENT: { name: string, options: (string | true)[] } = { name: `named-grid-areas-alignment`, options: [true] }

/**
 * Checks whether a character is a newline.
 * @param char - The character.
 * @returns True for a newline.
 */
function isNewline (char: string): boolean {
	return char === `\n` || char === `\r`
}

/**
 * Checks whether a character is inline whitespace.
 * @param char - The character.
 * @returns True for whitespace other than a newline.
 */
function isInlineWhitespace (char: string): boolean {
	return isWhitespace(char) && !isNewline(char)
}

/** The letter every character of a comment is written as, the same stand-in {@link maskEscapes} uses. */
const COMMENT_MASK = `x`

/**
 * Writes every character of a comment as a letter, so the walk finds no run, no quotation mark and no delimiter in a comment's text; a newline is none of those and is left standing.
 *
 * A letter stands in rather than a space, as {@link blankComments} writes: blanking a comment would join the run in front of it to the one behind and have the fix write the joined run — the comment — over with one space. The copy is as long as the text, so every position of a run holds in the value the fix writes into, and the newlines left standing carry the value's lines into the copy as {@link maskEscapes} carries them; nothing here turns on that, the walk asking about a break only for the character right behind one, which is never the character behind a comment's end.
 * @param text - The value the walk runs over.
 * @param spans - The comment spans the syntax found in it.
 * @returns The copy.
 */
function maskComments (text: string, spans: CommentSpan[]): string {
	if (spans.length === 0) return text

	let pieces = []
	let index = 0

	for (let { start, end } of spans) {
		let comment = ``

		// Counted in code units, as the walk reads the copy: a spread would write one letter over a surrogate pair and move every position behind it
		for (let at = start; at < end; at += 1) comment += isNewline(text.charAt(at)) ? text.charAt(at) : COMMENT_MASK

		pieces.push(text.slice(index, start), comment)
		index = end
	}

	pieces.push(text.slice(index))

	return pieces.join(``)
}

/**
 * Checks whether the quote at a position is escaped.
 * @param value - The string.
 * @param pos - The quote's position.
 * @returns True where escaped.
 */
function isEscapedQuote (value: string, pos: number): boolean {
	let backslashCount = 0

	for (let j = pos - 1; j >= 0 && value[j] === `\\`; j -= 1) backslashCount += 1

	return backslashCount % 2 !== 0
}

/**
 * Tracks whether a character stands inside a string; `skip` is true inside one and on its quotes.
 * @param char - The character.
 * @param inString - Whether inside a string.
 * @param stringChar - The string's quote.
 * @param value - The whole text the character stands in.
 * @param pos - The character's position.
 * @returns The new state.
 */
function handleStringChar (char: string, inString: boolean, stringChar: string, value: string, pos: number): {
	inString: boolean,
	stringChar: string,
	skip: boolean,
} {
	if (!inString && (char === `"` || char === `'`)) {
		return { inString: true, stringChar: char, skip: true }
	}

	if (inString && char === stringChar && !isEscapedQuote(value, pos)) {
		return { inString: false, stringChar: ``, skip: true }
	}

	if (inString) {
		return { inString, stringChar, skip: true }
	}

	return { inString, stringChar, skip: false }
}

/**
 * Replaces each run with one space, from the end so no replacement shifts the next.
 * @param value - The text the runs stand in.
 * @param errors - The runs.
 * @returns The fixed value.
 */
function fixWhitespaceErrors (value: string, errors: {
	start: number,
	count: number,
}[]): string {
	let newValue = value

	for (let e of errors.toReversed()) {
		newValue = `${newValue.slice(0, e.start)} ${newValue.slice(e.start + e.count)}`
	}

	return newValue
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/**
 * Disallows multiple whitespaces.
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
		})

		if (!validOptions) return

		// The runs between a grid row's tokens are `named-grid-areas-alignment`'s where it is configured with `alignColumns`: collapsing them would take turns with its padding on each `--fix` (#45). Its fix being live makes no difference, since it reports a hand-written table too
		let laysTablesOut = neighborCopies(root, result, GRID_ALIGNMENT).some(({ secondary }) => secondary.alignColumns === true)

		root.walkDecls((decl) => {
			let value = syntax.read(decl)
			let valueIndex = declarationValueIndex(decl)
			// A comment opens on a solidus, so a value spelling none holds none, and the scan is worth nothing there
			let comments = value.includes(`/`) ? syntax.commentSpans(value, decl, result) : []
			let owned: Span[] = laysTablesOut && GRID_AREAS_PROPERTY.test(decl.prop)
				? gridTableLines(value, valueParser(blankComments(value, comments)).nodes).flatMap(({ gaps }) => gaps)
				: []
			// A backslash spelling a character makes it one of a word, and the first whitespace character behind a hexadecimal escape closes the escape, so neither is a run of the value: the walk reads the copy with the escapes masked, and the fix writes into the value, where every position holds (1789855320)
			// A comment's text is no code of the value either, and the walk read it as code: it collapsed a run standing inside a comment, took the character a backslash covered there, which no escape span records, and opened a string on a quotation mark of a comment, which moved the run it then wrote into out of a string of the value (1789885007)
			let walked = maskComments(maskEscapes(value, findEscapeSpans(value, syntax.inlineComments(decl, result))), comments)
			let inString = false
			let stringChar = ``
			let afterNewline = true

			let errors: {
				start: number,
				count: number,
			}[] = []

			// Walk the characters for whitespace runs
			for (let i = 0; i < walked.length; i += 1) {
				let char = walked.charAt(i)

				let stringState = handleStringChar(char, inString, stringChar, walked, i)
				inString = stringState.inString
				stringChar = stringState.stringChar

				if (stringState.skip) {
					afterNewline = false
					continue
				}

				if (isNewline(char)) {
					afterNewline = true
					continue
				}

				if (isInlineWhitespace(char)) {
					// Indentation behind a newline is left alone
					if (afterNewline) {
						while (i < walked.length && isInlineWhitespace(walked.charAt(i))) i += 1
						afterNewline = false
						i -= 1
						continue
					}

					let whitespaceStart = i
					let whitespaceCount = 0

					while (i < walked.length && isInlineWhitespace(walked.charAt(i))) {
						whitespaceCount += 1
						i += 1
					}

					if (whitespaceCount > 1 && !owned.some(({ start, end }) => whitespaceStart >= start && whitespaceStart + whitespaceCount <= end)) errors.push({ start: whitespaceStart, count: whitespaceCount })
					i -= 1
				}
				afterNewline = false
			}

			for (let error of errors) {
				report({
					message: messages.rejected,
					node: decl,
					index: valueIndex + error.start,
					endIndex: valueIndex + error.start + error.count,
					result,
					ruleName,
					fix () {
						syntax.write(decl, fixWhitespaceErrors(value, errors))
					},
				})
			}
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
