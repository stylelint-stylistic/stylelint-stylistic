import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isWhitespace } from "../../utils/isWhitespace/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `no-multiple-whitespaces`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	rejected: `Unexpected multiple whitespace`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Checks if a character is a newline.
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is a newline.
 */
function isNewline (char) {
	return char === `\n` || char === `\r`
}

/**
 * Checks if a character is an inline whitespace (not a newline).
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is an inline whitespace.
 */
function isInlineWhitespace (char) {
	return isWhitespace(char) && !isNewline(char)
}

/**
 * Checks if a quote at the given position is escaped.
 * @param {string} value - The string value.
 * @param {number} pos - The position of the quote.
 * @returns {boolean} True if the quote is escaped.
 */
function isEscapedQuote (value, pos) {
	let backslashCount = 0

	for (let j = pos - 1; j >= 0 && value[j] === `\\`; j -= 1) backslashCount += 1

	return backslashCount % 2 !== 0
}

/**
 * Handles string character processing and updates string state.
 *
 * `skip: true` means the character is inside quotes or is a quote itself, so whitespace checks should be skipped for this character.
 * @param {string} char - The current character.
 * @param {boolean} inString - Whether currently inside a string.
 * @param {string} stringChar - The quote character of the current string.
 * @param {string} value - The full string value.
 * @param {number} pos - The position of the character.
 * @returns {{ inString: boolean, stringChar: string, skip: boolean }} Updated string state.
 */
function handleStringChar (char, inString, stringChar, value, pos) {
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
 * @param {string} value - The original value.
 * @param {{ start: number, count: number }[]} errors - Array of error positions.
 * @returns {string} The fixed value.
 */
function fixWhitespaceErrors (value, errors) {
	let newValue = value

	for (let j = errors.length - 1; j >= 0; j -= 1) {
		let e = errors[j]
		newValue = `${newValue.slice(0, e.start)} ${newValue.slice(e.start + e.count)}`
	}

	return newValue
}

/**
 * Disallows multiple whitespaces.
 * @type {import('stylelint').RuleBase<true>}
 */
function rule (primary) {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let value = getDeclarationValue(decl)
			let valueIndex = declarationValueIndex(decl)
			let inString = false
			let stringChar = ``
			let afterNewline = true

			/** @type {{ start: number, count: number }[]} */
			let errors = []

			// Main character iteration to find multiple whitespace errors
			for (let i = 0; i < value.length; i += 1) {
				let char = value[i]

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
						while (i < value.length && isInlineWhitespace(value[i])) i += 1
						afterNewline = false
						i -= 1
						continue
					}

					let whitespaceStart = i
					let whitespaceCount = 0

					while (i < value.length && isInlineWhitespace(value[i])) {
						whitespaceCount += 1
						i += 1
					}

					if (whitespaceCount > 1) errors.push({ start: whitespaceStart, count: whitespaceCount })
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
						setDeclarationValue(decl, fixWhitespaceErrors(value, errors))
					},
				})
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
