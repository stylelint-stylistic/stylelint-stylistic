import type { Node } from "postcss"
import valueParser, { type Node as ValueParserNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { RATIO_MEDIA_FEATURES } from "../../reference/mediaQueries.ts"
import { ASPECT_RATIO_PROPERTY, MEDIA_AT_RULE, NUMBER_WITHOUT_SIGN_OR_EXPONENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findMediaFeatureValues } from "../../utils/findMediaFeatureNames/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { isSingleLineString } from "../../utils/isSingleLineString/index.ts"
import type { NeighbourRule } from "../../utils/neighbourSettings/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isBoolean } from "../../utils/validateTypes/index.ts"
import { type Whitespace, whitespaceAsked } from "../../utils/whitespaceAsked/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `aspect-ratio-notation`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The solidus's neighbour rules by the whitespace they write, and the text whose lines they count. */
type SolidusNeighbours = {
	before: Partial<Record<Whitespace, NeighbourRule>>,
	after: Partial<Record<Whitespace, NeighbourRule>>,
	isSingleLine: () => boolean,
}

/** `value-slash-space-*` options. */
const VALUE_SLASH_SPACE_OPTIONS = [`always`, `never`, `always-single-line`, `never-single-line`]

/** `value-slash-newline-*` options. */
const VALUE_SLASH_NEWLINE_OPTIONS = [`always`, `always-multi-line`, `never-multi-line`]

/** `media-feature-slash-space-*` options. */
const MEDIA_SLASH_SPACE_OPTIONS = [`always`, `never`]

/** Rules about the run in front of a value's solidus ([#550](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/550), [#622](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/622)). */
const RULES_BEFORE_THE_SOLIDUS: Partial<Record<Whitespace, NeighbourRule>> = {
	space: { name: `value-slash-space-before`, options: VALUE_SLASH_SPACE_OPTIONS },
	newline: { name: `value-slash-newline-before`, options: VALUE_SLASH_NEWLINE_OPTIONS },
}

/** The rules about the run behind it. */
const RULES_AFTER_THE_SOLIDUS: Partial<Record<Whitespace, NeighbourRule>> = {
	space: { name: `value-slash-space-after`, options: VALUE_SLASH_SPACE_OPTIONS },
	newline: { name: `value-slash-newline-after`, options: VALUE_SLASH_NEWLINE_OPTIONS },
}

/** The same for a media feature. */
const MEDIA_RULES_BEFORE_THE_SOLIDUS: Partial<Record<Whitespace, NeighbourRule>> = {
	space: { name: `media-feature-slash-space-before`, options: MEDIA_SLASH_SPACE_OPTIONS },
}

/** The rule about the run behind it. */
const MEDIA_RULES_AFTER_THE_SOLIDUS: Partial<Record<Whitespace, NeighbourRule>> = {
	space: { name: `media-feature-slash-space-after`, options: MEDIA_SLASH_SPACE_OPTIONS },
}

/** Written beside a solidus no rule speaks of. */
const SOLIDUS_WHITESPACE_FALLBACK = ` `

/** `ratio` writes both numbers, `number-where-possible` drops a second number of one, `as-written` leaves the notation. */
export type PrimaryOption = `ratio` | `number-where-possible` | `as-written`

/** The secondary options. */
export type SecondaryOptions = {

	/** Whether the two numbers of a ratio are the smallest whole pair spelling it; `false` by default. */
	smallestIntegers?: boolean,

	/** `at-rules` leaves the ratio of a media feature alone and reads property values only. */
	ignore?: string[],
}

/**
 * Specifies the notation for the value of `aspect-ratio` and for the `<ratio>` of a media feature.
 *
 * The options are settled before the one write, so configuration order changes nothing; a solidus the fix adds is spaced as the `value-slash-*` rules ask, a space where none is configured ([#550](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/550)).
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @param secondaryOptions - The secondary options.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption, secondaryOptions: SecondaryOptions = {}): RuleCheck {
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
					ignore: [`at-rules`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let smallestIntegers = secondaryOptions.smallestIntegers ?? false

		// `as-written` with `smallestIntegers` off asks for nothing
		if (primary === `as-written` && !smallestIntegers) return

		root.walkDecls(ASPECT_RATIO_PROPERTY, (decl) => {
			check(decl, syntax.read(decl), declarationValueIndex(decl), (fixed) => syntax.write(decl, fixed), {
				before: RULES_BEFORE_THE_SOLIDUS,
				after: RULES_AFTER_THE_SOLIDUS,
				isSingleLine: () => isSingleLineString(declarationString(syntax, decl)),
			})
		})

		if (!optionsMatches(secondaryOptions, `ignore`, `at-rules`)) {
			root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
				if (!syntax.isStandardAtRule(atRule)) return

				let params = syntax.read(atRule)
				let neighbours: SolidusNeighbours = {
					before: MEDIA_RULES_BEFORE_THE_SOLIDUS,
					after: MEDIA_RULES_AFTER_THE_SOLIDUS,
					isSingleLine: () => isSingleLineString(params),
				}

				// A range feature holds two values; checked from the last forward so earlier positions hold
				for (let { start, end } of findMediaFeatureValues(params, RATIO_MEDIA_FEATURES).toReversed()) {
					check(atRule, params.slice(start, end), atRuleParamIndex(atRule) + start, (fixed) => {
						let current = syntax.read(atRule)

						syntax.write(atRule, current.slice(0, start) + fixed + current.slice(end))
					}, neighbours)
				}
			})
		}

		/**
		 * Checks one text a `<ratio>` may stand in; a declaration's value and a media feature's value are its two callers.
		 * @param node - The node the text is from.
		 * @param text - The value or media feature value a ratio may stand in.
		 * @param textIndex - Its offset in the node.
		 * @param write - Writes the fixed text.
		 * @param neighbours - The solidus's neighbour rules.
		 */
		function check (node: Node, text: string, textIndex: number, write: (fixed: string) => void, neighbours: SolidusNeighbours): void {
			let comments = syntax.commentSpans(text, node, result)
			// The value parser has no `//` comment node
			let ratio = findRatio(valueParser(blankComments(text, comments)).nodes)

			if (!ratio) return

			let { width, height } = ratio
			let [expectedWidth, expectedHeight, expectedHeightIsOne] = expectedNumbers(width.value, height?.value, smallestIntegers)
			let writesHeight = spellsHeight(primary, Boolean(height), expectedHeightIsOne)
			let edits = []

			if (width.value !== expectedWidth) edits.push({ start: width.sourceIndex, end: width.sourceEndIndex, text: expectedWidth })

			if (writesHeight && height && height.value !== expectedHeight) edits.push({ start: height.sourceIndex, end: height.sourceEndIndex, text: expectedHeight })

			// Each side: its rule's whitespace, the later-listed rule where two speak, else the fallback
			if (writesHeight && !height) {
				let before = whitespaceAsked(syntax, node, result, neighbours.before, neighbours.isSingleLine, SOLIDUS_WHITESPACE_FALLBACK)
				let after = whitespaceAsked(syntax, node, result, neighbours.after, neighbours.isSingleLine, SOLIDUS_WHITESPACE_FALLBACK)

				edits.push({ start: width.sourceEndIndex, end: width.sourceEndIndex, text: `${before}/${after}${expectedHeight}` })
			}

			// The cut takes the solidus however it is spaced
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
				// An edit over a comment would remove it: no fix
				...(!edits.some((edit) => holdsComment(edit, comments)) && { fix: (): void => write(applyEditsFromEnd(text, edits)) }),
			})
		}
	}
}

/** The two numbers of a `<ratio>`. */
type Ratio = {
	width: ValueParserNode,
	height: ValueParserNode | undefined,
}

/**
 * Finds the numbers of a value that is `auto || <ratio>` and nothing else; a call, a variable or a keyword makes it unreadable.
 * @param nodes - The parsed value, comments blanked.
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
			// `auto` behind a number ends the ratio, so a ratio token after it stood inside
			hasAutoBehindNumber = numbers.length > 0
			continue
		}

		if (node.type === `div` && node.value === `/`) {
			if (hasSolidus || hasAutoBehindNumber || numbers.length !== 1) return

			hasSolidus = true
			continue
		}

		if (node.type === `word` && NUMBER_WITHOUT_SIGN_OR_EXPONENT.test(node.value)) {
			// A solidus between two numbers, and no third
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
 * The two numbers of a ratio and whether the second is one: as written (`1` where unwritten), or the smallest whole numbers under `smallestIntegers`; a zero on either side stays as written.
 * @param width - The first number as written.
 * @param height - The second, or nothing.
 * @param smallestIntegers - Whether to reduce.
 * @returns The two numbers and whether the second is one.
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
 * Says whether the second number is written.
 * @param primary - `ratio`, `number-where-possible` or `as-written`.
 * @param isWritten - Whether the value writes one.
 * @param isHeightOne - Whether it is one.
 * @returns True where it is written.
 */
function spellsHeight (primary: string, isWritten: boolean, isHeightOne: boolean): boolean {
	if (primary === `ratio`) return true

	if (primary === `number-where-possible`) return !isHeightOne

	// `as-written`: the author's choice stands where one number can say the ratio
	return isWritten || !isHeightOne
}

/**
 * Takes two numbers to a common scale as whole numbers, by their digits: `1.777` times a thousand is `1777.0000000000002` in a float.
 * @param width - The first number.
 * @param height - The second.
 * @returns The scaled numbers, or nothing where either is zero.
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
 * Splits a number into its digits and the count behind the point.
 * @param number - The number, without sign or exponent.
 * @returns The digits and the count.
 */
function splitDecimal (number: string): [string, number] {
	let point = number.indexOf(`.`)

	if (point === -1) return [number, 0]

	return [`${number.slice(0, point)}${number.slice(point + 1)}`, number.length - point - 1]
}

/**
 * Says whether a number is one in any spelling.
 * @param number - The number, without sign or exponent.
 * @returns True where it is one.
 */
function isOne (number: string): boolean {
	let [digits, scale] = splitDecimal(number)

	return BigInt(digits) === 10n ** BigInt(scale)
}

/**
 * The greatest common divisor of two whole numbers.
 * @param one - The first, above zero.
 * @param other - The second, above zero.
 * @returns The divisor.
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
 * Says whether an edit overlaps a comment.
 * @param edit - The edit, in the text's coordinates.
 * @param comments - The comment spans.
 * @returns True where one overlaps.
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
