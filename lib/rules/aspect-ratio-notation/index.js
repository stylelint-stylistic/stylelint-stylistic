import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { ASPECT_RATIO_PROPERTY, NUMBER_WITHOUT_SIGN_OR_EXPONENT } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { applyEditsFromEnd } from "../../utils/applyEditsFromEnd/index.js"
import { blankComments } from "../../utils/blankComments/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { findCommentSpans } from "../../utils/findCommentSpans/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isBoolean } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `aspect-ratio-notation`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies the notation for the value of `aspect-ratio`.
 *
 * The rule reads one value along two axes that do not depend on each other: the primary option decides how many numbers are written, and `smallestIntegers` decides what those numbers are. Both are settled before anything is written, and the whole value is written once, so neither axis can be applied by halves and no order in the configuration can change the outcome.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions = {}) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [`ratio`, `number-where-possible`, `as-written`],
			},
			{
				actual: secondaryOptions,
				possible: {
					smallestIntegers: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let smallestIntegers = secondaryOptions.smallestIntegers ?? false

		// `as-written` says nothing about how many numbers are written, so with the other axis off the rule has an opinion about nothing at all
		if (primary === `as-written` && !smallestIntegers) return

		root.walkDecls(ASPECT_RATIO_PROPERTY, (decl) => {
			check(decl, getDeclarationValue(decl), declarationValueIndex(decl), (fixed) => setDeclarationValue(decl, fixed))
		})

		/**
		 * Checks one text a `<ratio>` may be written in, and reports the ratio it holds where that ratio is written otherwise than the options ask.
		 *
		 * The node, its text, where that text begins and how it is written back are all handed over, rather than read off the node here, so that a text of another kind — the parameters of a media feature, which this rule does not yet read — is one more caller rather than a branch inside.
		 * @param {import('postcss').Node} node - The node the text was read from, which a problem is reported against.
		 * @param {string} text - The text to check.
		 * @param {number} textIndex - The offset from the start of the node to the first character of that text.
		 * @param {(fixed: string) => void} write - Writes the fixed text back to the node.
		 */
		function check (node, text, textIndex, write) {
			let comments = findCommentSpans(text, readsInlineComments(node, result))
			// The value parser has a node for a block comment and none for a comment opened by a double slash, whose text comes back as ordinary words and divs. Blanking every comment out answers both at once: the copy spells the text character for character everywhere else, so every position below counts in the text itself, and what the parse holds is code the file spells and nothing else.
			let ratio = findRatio(valueParser(blankComments(text, comments)).nodes)

			if (!ratio) return

			let { width, height } = ratio
			let [expectedWidth, expectedHeight, expectedHeightIsOne] = expectedNumbers(width.value, height?.value, smallestIntegers)
			let writesHeight = spellsHeight(primary, Boolean(height), expectedHeightIsOne)
			let edits = []

			if (width.value !== expectedWidth) edits.push({ start: width.sourceIndex, end: width.sourceEndIndex, text: expectedWidth })

			if (writesHeight && height && height.value !== expectedHeight) edits.push({ start: height.sourceIndex, end: height.sourceEndIndex, text: expectedHeight })

			if (writesHeight && !height) edits.push({ start: width.sourceEndIndex, end: width.sourceEndIndex, text: ` / ${expectedHeight}` })

			// The run taken out reaches from the end of the first number to the end of the second, so the solidus goes with it however it is spaced
			if (!writesHeight && height) edits.push({ start: width.sourceEndIndex, end: height.sourceEndIndex, text: `` })

			if (edits.length === 0) return

			let start = width.sourceIndex
			let end = height ? height.sourceEndIndex : width.sourceEndIndex
			let actual = text.slice(start, end)
			let expected = applyEditsFromEnd(actual, edits.map((edit) => ({ ...edit, start: edit.start - start, end: edit.end - start })))

			report({
				message: messages.expected,
				messageArgs: [actual, expected],
				node,
				index: textIndex + start,
				endIndex: textIndex + end,
				result,
				ruleName,
				// A comment standing between the two numbers is code, and the run that takes the second number away holds it: taking a comment out of a stylesheet is nothing this rule was asked to do, so the problem is reported and the value left for a reader to settle
				fix: edits.some((edit) => holdsComment(edit, comments))
					? null
					: () => write(applyEditsFromEnd(text, edits)),
			})
		}
	}
}

/**
 * The two numbers a `<ratio>` is written with, as the value parser read them.
 * @typedef {{ width: import('postcss-value-parser').Node, height?: import('postcss-value-parser').Node }} Ratio
 */

/**
 * Finds the numbers of the `<ratio>` a value holds, where the value spells `auto || <ratio>` and nothing else.
 *
 * The grammar of the property is `auto || <ratio>`, and `<ratio>` is one number with an optional second one behind a solidus. Anything else standing at the top level — a call, a variable of another syntax, a keyword such as `inherit` — makes the value one this rule cannot read, and reading part of it would be reading a value the file does not spell.
 * @param {import('postcss-value-parser').Node[]} nodes - The nodes of the parsed value, comments already blanked out of it.
 * @returns {Ratio | undefined} The numbers, or nothing where the value is no bare ratio.
 */
function findRatio (nodes) {
	let numbers = []
	let hasAuto = false
	let hasAutoBehindNumber = false
	let hasSolidus = false

	for (let node of nodes) {
		if (node.type === `space`) continue

		if (node.type === `word` && node.value.toLowerCase() === `auto`) {
			if (hasAuto) return

			hasAuto = true
			// The two components of `auto || <ratio>` stand apart, so a keyword read once a number has been is one standing behind the whole ratio — until another of its tokens turns up behind that keyword, and then the keyword was reaching in between them
			hasAutoBehindNumber = numbers.length > 0
			continue
		}

		if (node.type === `div` && node.value === `/`) {
			if (hasSolidus || hasAutoBehindNumber || numbers.length !== 1) return

			hasSolidus = true
			continue
		}

		if (node.type === `word` && NUMBER_WITHOUT_SIGN_OR_EXPONENT.test(node.value)) {
			// Two numbers stand in a ratio only with the solidus between them, and a third stands in none
			if (hasAutoBehindNumber || numbers.length === 2 || (numbers.length === 1 && !hasSolidus)) return

			numbers.push(node)
			continue
		}

		return
	}

	if (numbers.length === 0 || (hasSolidus && numbers.length !== 2)) return

	return { width: numbers[0], height: numbers[1] }
}

/**
 * Works out what the two numbers of a ratio are to be, and whether the second of them is one.
 *
 * With `smallestIntegers` off the numbers are the ones the file spells, and the second is the one it spells or, where it spells none, the `1` the grammar reads there. With it on they are the smallest pair of whole numbers the same ratio can be written with.
 *
 * A ratio with a zero on either side is degenerate and there is nothing to divide it by, so it comes back written as it stands. That leaves it to the other axis, which asks how many numbers are written and never what they are: making the whole value escape both axes would tie the one to the other, and the two are meant to be answerable apart.
 * @param {string} width - The first number, as it is written.
 * @param {string | undefined} height - The second number as it is written, or nothing where the value spells none.
 * @param {boolean} smallestIntegers - Whether the numbers are to be the smallest whole ones.
 * @returns {[string, string, boolean]} The first number, the second, and whether the second is one.
 */
function expectedNumbers (width, height, smallestIntegers) {
	let writtenHeight = height ?? `1`
	let scaled = smallestIntegers ? toCommonScale(width, writtenHeight) : undefined

	if (!scaled) return [width, writtenHeight, isOne(writtenHeight)]

	let [numerator, denominator] = scaled
	let divisor = greatestCommonDivisor(numerator, denominator)
	let reducedDenominator = denominator / divisor

	return [`${numerator / divisor}`, `${reducedDenominator}`, reducedDenominator === 1n]
}

/**
 * Says whether the second number of the ratio is written.
 * @param {string} primary - The primary option.
 * @param {boolean} isWritten - Whether the value spells a second number as it stands.
 * @param {boolean} isHeightOne - Whether the second number is one.
 * @returns {boolean} True where the second number is to be written.
 */
function spellsHeight (primary, isWritten, isHeightOne) {
	if (primary === `ratio`) return true

	if (primary === `number-where-possible`) return !isHeightOne

	// Under `as-written` the choice is the author's, and the arithmetic overrules it only where the second number carries something a single number cannot say
	return isWritten || !isHeightOne
}

/**
 * Takes two numbers to a common scale, as the whole numbers they are written with and a power of ten.
 *
 * The scaling is done on the digits rather than on the numbers: `1.777` times a thousand is `1777.0000000000002` in a float, and every question below is asked of exact whole numbers instead.
 * @param {string} width - The first number.
 * @param {string} height - The second number.
 * @returns {[bigint, bigint] | undefined} The two numbers at a common scale, or nothing where either of them is zero.
 */
function toCommonScale (width, height) {
	let [widthDigits, widthScale] = splitDecimal(width)
	let [heightDigits, heightScale] = splitDecimal(height)
	let scale = Math.max(widthScale, heightScale)
	let numerator = BigInt(widthDigits) * (10n ** BigInt(scale - widthScale))
	let denominator = BigInt(heightDigits) * (10n ** BigInt(scale - heightScale))

	if (numerator === 0n || denominator === 0n) return

	return [numerator, denominator]
}

/**
 * Splits a number into the digits it is written with and how far its point stands from the end of them.
 * @param {string} number - The number, written with neither a sign nor an exponent.
 * @returns {[string, number]} The digits, and how many of them stand behind the point.
 */
function splitDecimal (number) {
	let point = number.indexOf(`.`)

	if (point === -1) return [number, 0]

	return [`${number.slice(0, point)}${number.slice(point + 1)}`, number.length - point - 1]
}

/**
 * Says whether a number is one, whichever of its spellings it is written in.
 * @param {string} number - The number, written with neither a sign nor an exponent.
 * @returns {boolean} True where the number is one.
 */
function isOne (number) {
	let [digits, scale] = splitDecimal(number)

	return BigInt(digits) === 10n ** BigInt(scale)
}

/**
 * The greatest number both of two whole numbers can be divided by.
 * @param {bigint} one - The first number, which is above zero.
 * @param {bigint} other - The second number, which is above zero.
 * @returns {bigint} Their greatest common divisor.
 */
function greatestCommonDivisor (one, other) {
	let divided = one
	let divisor = other

	while (divisor !== 0n) {
		let rest = divided % divisor

		divided = divisor
		divisor = rest
	}

	return divided
}

/**
 * Says whether an edit covers any part of a comment.
 * @param {{ start: number, end: number }} edit - The edit, in the coordinates of the text it is to be written into.
 * @param {{ start: number, end: number }[]} comments - The spans the comments of that text occupy in it.
 * @returns {boolean} True where a comment stands in what the edit writes over.
 */
function holdsComment (edit, comments) {
	return comments.some(({ start, end }) => start < edit.end && end > edit.start)
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
