import type { Node } from "postcss"
import valueParser, { type Node as ValueParserNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { ASPECT_RATIO_PROPERTY, NUMBER_WITHOUT_SIGN_OR_EXPONENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd } from "../../utils/applyEditsFromEnd/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { readsInlineComments } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isBoolean } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `aspect-ratio-notation`

const MESSAGES = defineMessages({
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
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `ratio`, `number-where-possible` and `as-written`.
 * @param secondaryOptions - The secondary options: `smallestIntegers`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `ratio` | `number-where-possible` | `as-written`, secondaryOptions: { smallestIntegers?: boolean } = {}): RuleCheck {
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
			check(decl, syntax.read(decl), declarationValueIndex(decl), (fixed) => syntax.write(decl, fixed))
		})

		/**
		 * Checks one text a `<ratio>` may be written in, and reports the ratio it holds where that ratio is written otherwise than the options ask.
		 *
		 * The node, its text, where that text begins and how it is written back are all handed over, rather than read off the node here, so that a text of another kind — the parameters of a media feature, which this rule does not yet read — is one more caller rather than a branch inside.
		 * @param node - The node the text was read from, which a problem is reported against.
		 * @param text - The text to check.
		 * @param textIndex - The offset from the start of the node to the first character of that text.
		 * @param write - Writes the fixed text back to the node.
		 */
		function check (node: Node, text: string, textIndex: number, write: (fixed: string) => void): void {
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
				...(!edits.some((edit) => holdsComment(edit, comments)) && { fix: (): void => write(applyEditsFromEnd(text, edits)) }),
			})
		}
	}
}

/** The two numbers a `<ratio>` is written with, as the value parser read them. */
type Ratio = {
	width: ValueParserNode,
	height: ValueParserNode | undefined,
}

/**
 * Finds the numbers of the `<ratio>` a value holds, where the value spells `auto || <ratio>` and nothing else.
 *
 * The grammar of the property is `auto || <ratio>`, and `<ratio>` is one number with an optional second one behind a solidus. Anything else standing at the top level — a call, a variable of another syntax, a keyword such as `inherit` — makes the value one this rule cannot read, and reading part of it would be reading a value the file does not spell.
 * @param nodes - The nodes of the parsed value, comments already blanked out of it.
 * @returns The numbers, or nothing where the value is no bare ratio.
 */
function findRatio (nodes: ValueParserNode[]): Ratio | undefined {
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

	if (hasSolidus && numbers.length !== 2) return

	let [width, height] = numbers

	if (!width) return

	return { width, height }
}

/**
 * Works out what the two numbers of a ratio are to be, and whether the second of them is one.
 *
 * With `smallestIntegers` off the numbers are the ones the file spells, and the second is the one it spells or, where it spells none, the `1` the grammar reads there. With it on they are the smallest pair of whole numbers the same ratio can be written with.
 *
 * A ratio with a zero on either side is degenerate and there is nothing to divide it by, so it comes back written as it stands. That leaves it to the other axis, which asks how many numbers are written and never what they are: making the whole value escape both axes would tie the one to the other, and the two are meant to be answerable apart.
 * @param width - The first number, as it is written.
 * @param height - The second number as it is written, or nothing where the value spells none.
 * @param smallestIntegers - Whether the numbers are to be the smallest whole ones.
 * @returns The first number, the second, and whether the second is one.
 */
function expectedNumbers (width: string, height: string | undefined, smallestIntegers: boolean): [string, string, boolean] {
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
 * @param primary - The primary option.
 * @param isWritten - Whether the value spells a second number as it stands.
 * @param isHeightOne - Whether the second number is one.
 * @returns True where the second number is to be written.
 */
function spellsHeight (primary: string, isWritten: boolean, isHeightOne: boolean): boolean {
	if (primary === `ratio`) return true

	if (primary === `number-where-possible`) return !isHeightOne

	// Under `as-written` the choice is the author's, and the arithmetic overrules it only where the second number carries something a single number cannot say
	return isWritten || !isHeightOne
}

/**
 * Takes two numbers to a common scale, as the whole numbers they are written with and a power of ten.
 *
 * The scaling is done on the digits rather than on the numbers: `1.777` times a thousand is `1777.0000000000002` in a float, and every question below is asked of exact whole numbers instead.
 * @param width - The first number.
 * @param height - The second number.
 * @returns The two numbers at a common scale, or nothing where either of them is zero.
 */
function toCommonScale (width: string, height: string): [bigint, bigint] | undefined {
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
 * @param number - The number, written with neither a sign nor an exponent.
 * @returns The digits, and how many of them stand behind the point.
 */
function splitDecimal (number: string): [string, number] {
	let point = number.indexOf(`.`)

	if (point === -1) return [number, 0]

	return [`${number.slice(0, point)}${number.slice(point + 1)}`, number.length - point - 1]
}

/**
 * Says whether a number is one, whichever of its spellings it is written in.
 * @param number - The number, written with neither a sign nor an exponent.
 * @returns True where the number is one.
 */
function isOne (number: string): boolean {
	let [digits, scale] = splitDecimal(number)

	return BigInt(digits) === 10n ** BigInt(scale)
}

/**
 * The greatest number both of two whole numbers can be divided by.
 * @param one - The first number, which is above zero.
 * @param other - The second number, which is above zero.
 * @returns Their greatest common divisor.
 */
function greatestCommonDivisor (one: bigint, other: bigint): bigint {
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
 * @param edit - The edit, in the coordinates of the text it is to be written into.
 * @param comments - The spans the comments of that text occupy in it.
 * @returns True where a comment stands in what the edit writes over.
 */
function holdsComment (edit: {
	start: number,
	end: number,
}, comments: {
	start: number,
	end: number,
}[]): boolean {
	return comments.some(({ start, end }) => start < edit.end && end > edit.start)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
