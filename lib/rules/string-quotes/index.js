import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { addNamespace } from "../../utils/addNamespace/index.js"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.js"
import { parseSelector } from "../../utils/parseSelector/index.js"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isAtRule } from "../../utils/typeGuards/index.js"
import { assertString, isBoolean } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `string-quotes`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (q) => `Expected ${q} quotes`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

let singleQuote = `'`
let doubleQuote = `"`

/**
 * Specifies single or double quotes around strings.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions) {
	let correctQuote = primary === `single` ? singleQuote : doubleQuote
	let erroneousQuote = primary === `single` ? doubleQuote : singleQuote

	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`single`, `double`],
			},
			{
				actual: secondaryOptions,
				possible: {
					avoidEscape: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let avoidEscape = secondaryOptions && secondaryOptions.avoidEscape !== undefined ? secondaryOptions.avoidEscape : true

		// A double slash opens a comment only where the syntax says it does. Elsewhere it is part
		// of a value — an address, most often — and reading it as a comment would silence every
		// string behind it on the line. The two spellings are identical, so the text cannot
		// answer this and the syntax has to. The question waits until a double slash turns up,
		// since answering it costs a parse and most stylesheets never ask.
		let syntax = result.opts && result.opts.syntax

		root.walk((node) => {
			switch (node.type) {
				case `atrule`:
					checkDeclOrAtRule(node, getAtRuleParams(node), atRuleParamIndex)
					break
				case `decl`:
					checkDeclOrAtRule(node, getDeclarationValue(node), declarationValueIndex)
					break
				case `rule`:
					checkRule(node)
					break
				// no default
			}
		})

		/**
		 * Checks a rule node for quote violations.
		 * @param {import('postcss').Rule} ruleNode - The rule node to check.
		 * @returns {void}
		 */
		function checkRule (ruleNode) {
			if (!isStandardSyntaxRule(ruleNode)) return

			if (!ruleNode.selector.includes(`[`) || !ruleNode.selector.includes(`=`)) return

			/** @type {number[]} */
			let fixPositions = []

			parseSelector(ruleNode.selector, result, ruleNode, (selectorTree) => {
				let selectorFixed = false

				selectorTree.walkAttributes((attributeNode) => {
					if (!attributeNode.quoted) return

					const maybeProblemIndex = attributeNode.sourceIndex + attributeNode.offsetOf(`value`)

					if (attributeNode.quoteMark === correctQuote && avoidEscape) {
						assertString(attributeNode.value)

						let needsCorrectEscape = attributeNode.value.includes(correctQuote)
						let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

						if (needsOtherEscape) return

						if (needsCorrectEscape) {
							report({
								message: messages.expected,
								messageArgs: [primary === `single` ? `double` : primary],
								node: ruleNode,
								index: maybeProblemIndex,
								endIndex: maybeProblemIndex,
								result,
								ruleName,
								fix () {
									selectorFixed = true
									attributeNode.quoteMark = erroneousQuote
								},
							})
						}
					}

					if (attributeNode.quoteMark === erroneousQuote) {
						if (avoidEscape) {
							assertString(attributeNode.value)

							let needsCorrectEscape = attributeNode.value.includes(correctQuote)
							let needsOtherEscape = attributeNode.value.includes(erroneousQuote)

							if (needsOtherEscape) {
								report({
									message: messages.expected,
									messageArgs: [primary],
									node: ruleNode,
									index: maybeProblemIndex,
									endIndex: maybeProblemIndex,
									result,
									ruleName,
									fix () {
										selectorFixed = true
										attributeNode.quoteMark = correctQuote
									},
								})

								return
							}

							if (needsCorrectEscape) return
						}

						report({
							message: messages.expected,
							messageArgs: [primary],
							node: ruleNode,
							index: maybeProblemIndex,
							endIndex: maybeProblemIndex,
							result,
							ruleName,
							fix () {
								selectorFixed = true
								attributeNode.quoteMark = correctQuote
							},
						})
					}
				})

				if (selectorFixed) ruleNode.selector = selectorTree.toString()
			})

			for (let fixIndex of fixPositions) ruleNode.selector = replaceQuote(ruleNode.selector, fixIndex, correctQuote)
		}

		/**
		 * Checks a declaration or at-rule node for quote violations.
		 * @template {import('postcss').AtRule | import('postcss').Declaration} T
		 * @param {T} node - The node to check.
		 * @param {string} value - The value to check, in the coordinates of the source file.
		 * @param {(node: T) => number} getIndex - Function to get the index of the node.
		 * @returns {void}
		 */
		function checkDeclOrAtRule (node, value, getIndex) {
			/** @type {number[]} */
			let fixPositions = []

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) return

			let raws = isAtRule(node) ? node.raws.params : node.raws.value

			// `postcss-scss` rewrites every `//` comment inside the raw into `/* … */`, keeps the
			// source spelling in a third field and prefers that field on output. The two texts run
			// character for character up to the first such comment, so a string in front of it is
			// still in the coordinates of the file while one behind it is two characters off per
			// comment, and a fix written into the raw would not reach the output at all.
			let hasInlineComment = Boolean(raws && raws.scss)
			let inlineCommentIndex = hasInlineComment ? commonPrefixLength(raws.raw, raws.scss) : Infinity

			// `postcss-less` leaves the `//` comment of a variable spanning more than one line inside the params, where the value tokenizer takes the quotes in its text for a string of code.
			let inlineCommentSpans = value.includes(`//`) && syntaxKeepsInlineComments(syntax) ? findInlineCommentSpans(value) : []

			if (isAtRule(node) && node.name === `charset`) {
				let hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// pass through to the fixer only if the primary option is "double"
				if (hasValidQuotes || correctQuote === `'`) return
			}

			valueParser(value).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					let needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// don't consider this an error
						return
					}

					const openIndex = valueNode.sourceIndex

					// Behind an inline comment the raw no longer measures the file
					if (openIndex >= inlineCommentIndex) return

					// Inside one, the quotes belong to the text of the comment rather than to the code
					if (inlineCommentSpans.some(({ start, end }) => openIndex >= start && openIndex < end)) return

					const problemIndex = getIndex(node) + openIndex

					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix: hasInlineComment
							? undefined
							: () => {
								// we currently don't fix escapes
								if (!needsEscape) {
									let closeIndex = openIndex + valueNode.value.length + erroneousQuote.length

									fixPositions.push(openIndex, closeIndex)
								}
							},
					})
				}
			})

			if (fixPositions.length === 0) return

			let fixed = value

			for (let fixIndex of fixPositions) fixed = replaceQuote(fixed, fixIndex, correctQuote)

			if (isAtRule(node)) setAtRuleParams(node, fixed)
			else setDeclarationValue(node, fixed)
		}
	}
}

/** @type {WeakMap<object, boolean>} The verdict of {@link syntaxKeepsInlineComments}, per syntax. */
let inlineCommentSyntaxes = new WeakMap()

/** A stylesheet holding an inline comment in both of the places the verdict turns on. */
let inlineCommentProbe = `a {}\n// comment\na { b: 'x', // comment\n  'y'; }\n`

/**
 * Asks a syntax whether a double slash left inside a value is a comment, by handing it one and
 * looking at what comes back. Two answers are needed and neither suffices alone: a syntax without
 * inline comments spells no comment that way, and one that rewrites them into block comments as
 * it parses leaves nothing behind for the scan to find, so whatever double slash survives in such
 * a value is part of an address instead. Naming the syntaxes that qualify would miss every custom
 * one, and a syntax passed as an object has no name to go by in the first place.
 * @param {any} syntax - The syntax the stylesheet was parsed with.
 * @returns {boolean} True if a double slash in a value of this syntax opens a comment.
 */
function syntaxKeepsInlineComments (syntax) {
	if (!syntax || typeof syntax.parse !== `function`) return false

	let known = inlineCommentSyntaxes.get(syntax)

	if (known !== undefined) return known

	let hasInlineComments = false
	let keepsThemInValues = false

	try {
		let probe = syntax.parse(inlineCommentProbe, { from: undefined })

		probe.walkComments((comment) => {
			if (comment.inline || comment.raws.inline) hasInlineComments = true
		})
		probe.walkDecls((decl) => {
			if (getDeclarationValue(decl).includes(`//`)) keepsThemInValues = true
		})
	}
	catch {
		// A syntax that cannot parse the probe at all spells no comment with a double slash
	}

	let verdict = hasInlineComments && keepsThemInValues

	inlineCommentSyntaxes.set(syntax, verdict)

	return verdict
}

/**
 * Finds the spans the inline comments of a string occupy in it. A double slash belonging to an address opens no comment, whether the address is quoted or bare inside `url()`, and neither does one inside a block comment; a comment ends with its line rather than with the string.
 * @param {string} text - The string to scan.
 * @returns {{ start: number, end: number }[]} The spans, in the coordinates of the scanned string.
 */
function findInlineCommentSpans (text) {
	/** @type {{ start: number, end: number }[]} */
	let spans = []
	let index = 0

	while (index < text.length) {
		let character = text[index]
		let next = text[index + 1]

		if (character === `"` || character === `'`) {
			index = skipString(text, index)
		}
		else if (character === `u` || character === `U`) {
			let behindUrl = skipUrl(text, index)

			index = behindUrl === index ? index + 1 : behindUrl
		}
		else if (character === `/` && next === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)

			index = closeIndex === -1 ? text.length : closeIndex + 2
		}
		else if (character === `/` && next === `/`) {
			let lineBreakIndex = text.indexOf(`\n`, index)
			let end = lineBreakIndex === -1 ? text.length : lineBreakIndex

			spans.push({ start: index, end })
			index = end
		}
		else {
			index += 1
		}
	}

	return spans
}

/**
 * Skips a `url()` token, whose address carries its double slashes as ordinary characters whether
 * it is quoted or bare. The name has to stand on its own — `image-url(` and `@{prefix}url(` end
 * in the same four characters while being ordinary calls, whose arguments may hold a comment —
 * and the parentheses are counted rather than searched for, since an interpolated address brings
 * its own. A parenthesis that is escaped, quoted or commented out is none, and a token left open
 * is taken for no token at all, so that a comment standing behind it is still seen.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index the token would start at.
 * @returns {number} The index behind the closing parenthesis, or the given one if no `url()`
 *   starts and ends there.
 */
function skipUrl (text, openIndex) {
	if (text.slice(openIndex, openIndex + 4).toLowerCase() !== `url(`) return openIndex

	if (openIndex > 0 && (/[\w}-]/u).test(text[openIndex - 1])) return openIndex

	let depth = 1
	let index = openIndex + 4

	while (index < text.length && depth > 0) {
		let character = text[index]

		if (character === `\\`) {
			index += 2
		}
		else if (character === `"` || character === `'`) {
			index = skipString(text, index)
		}
		else if (character === `/` && text[index + 1] === `*`) {
			let closeIndex = text.indexOf(`*/`, index + 2)

			index = closeIndex === -1 ? text.length : closeIndex + 2
		}
		else {
			if (character === `(`) depth += 1
			else if (character === `)`) depth -= 1

			index += 1
		}
	}

	return depth > 0 ? openIndex : index
}

/**
 * Skips a quoted string, from its opening quote to the character behind its closing one. An
 * escaped quotation mark closes nothing, and a string mistaken for closed here would leave the
 * text of the next one exposed to the scan.
 * @param {string} text - The string being scanned.
 * @param {number} openIndex - The index of the opening quote.
 * @returns {number} The index behind the closing quote, or the end of the scanned string.
 */
function skipString (text, openIndex) {
	let quote = text[openIndex]
	let index = openIndex + 1

	while (index < text.length && text[index] !== quote) index += text[index] === `\\` ? 2 : 1

	return index + 1
}

/**
 * Counts the characters two strings begin with in common.
 * @param {string} one - The first string.
 * @param {string} other - The second string.
 * @returns {number} The length of the common prefix.
 */
function commonPrefixLength (one, other) {
	let index = 0

	while (index < one.length && index < other.length && one[index] === other[index]) index += 1

	return index
}

/**
 * Replaces a quote character in a string at the specified index.
 * @param {string} string - The input string.
 * @param {number} index - The index at which to replace the quote.
 * @param {string} replace - The replacement quote character.
 * @returns {string} The string with the quote replaced.
 */
function replaceQuote (string, index, replace) {
	return string.slice(0, index) + replace + string.slice(index + replace.length)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
