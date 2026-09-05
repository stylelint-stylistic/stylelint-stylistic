import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { GRID_AREAS_PROPERTY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { gridTableLines, type Span } from "../../utils/gridTableLines/index.ts"
import { isWhitespace } from "../../utils/isWhitespace/index.ts"
import { neighbourSetting } from "../../utils/neighbourSettings/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `no-multiple-whitespaces`

const MESSAGES = defineMessages({
	rejected: `Unexpected multiple whitespace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The rule that lays the rows of a grid shorthand out as a table, whose `alignColumns` option makes the runs between the tokens of such a row its own. */
const GRID_ALIGNMENT: { name: string, options: (string | true)[] } = { name: `named-grid-areas-alignment`, options: [true] }

/**
 * Checks if a character is a newline.
 * @param char - The character to check.
 * @returns True if the character is a newline.
 */
function isNewline (char: string): boolean {
	return char === `\n` || char === `\r`
}

/**
 * Checks if a character is an inline whitespace (not a newline).
 * @param char - The character to check.
 * @returns True if the character is an inline whitespace.
 */
function isInlineWhitespace (char: string): boolean {
	return isWhitespace(char) && !isNewline(char)
}

/**
 * Checks if a quote at the given position is escaped.
 * @param value - The string value.
 * @param pos - The position of the quote.
 * @returns True if the quote is escaped.
 */
function isEscapedQuote (value: string, pos: number): boolean {
	let backslashCount = 0

	for (let j = pos - 1; j >= 0 && value[j] === `\\`; j -= 1) backslashCount += 1

	return backslashCount % 2 !== 0
}

/**
 * Handles string character processing and updates string state.
 *
 * `skip: true` means the character is inside quotes or is a quote itself, so whitespace checks should be skipped for this character.
 * @param char - The current character.
 * @param inString - Whether currently inside a string.
 * @param stringChar - The quote character of the current string.
 * @param value - The full string value.
 * @param pos - The position of the character.
 * @returns Updated string state.
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
 * Fixes whitespace errors by replacing multiple whitespaces with single ones.
 *
 * The errors are walked in reverse order, so that replacing one never shifts the indices of those still to come.
 * @param value - The original value.
 * @param errors - Array of error positions.
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

/**
 * Disallows multiple whitespaces.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, which is `true`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: true): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
		})

		if (!validOptions) return

		// The runs between the tokens of a row of a grid shorthand are `named-grid-areas-alignment`'s where the configuration lists it with `alignColumns`: that rule pads them into columns, and a rule collapsing them would take the run in turns with it, on one run of `--fix` and the next (#45). The runs are its own whether its fix is live or not, since a table an author wrote by hand is one that rule reports and this one would otherwise take apart on every run, leaving a warning no run of `--fix` clears. What is read is the option, once per root, and the lines of a declaration only where the option asks
		let laysTablesOut = neighbourSetting(syntax, result, GRID_ALIGNMENT)?.secondary.alignColumns === true

		root.walkDecls((decl) => {
			let value = syntax.read(decl)
			let valueIndex = declarationValueIndex(decl)
			let owned: Span[] = laysTablesOut && GRID_AREAS_PROPERTY.test(decl.prop)
				? gridTableLines(value, valueParser(blankComments(value, syntax.commentSpans(value, decl, result))).nodes).flatMap(({ gaps }) => gaps)
				: []
			let inString = false
			let stringChar = ``
			let afterNewline = true

			let errors: {
				start: number,
				count: number,
			}[] = []

			// Main character iteration to find multiple whitespace errors
			for (let i = 0; i < value.length; i += 1) {
				let char = value.charAt(i)

				let stringState = handleStringChar(char, inString, stringChar, value, i)
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
					// afterNewline: skip leading whitespace (indentation) after a newline
					if (afterNewline) {
						while (i < value.length && isInlineWhitespace(value.charAt(i))) i += 1
						afterNewline = false
						i -= 1
						continue
					}

					let whitespaceStart = i
					let whitespaceCount = 0

					while (i < value.length && isInlineWhitespace(value.charAt(i))) {
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
