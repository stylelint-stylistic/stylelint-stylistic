import type { AtRule, Declaration, Rule } from "postcss"
import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { parseSelector } from "../../utils/parseSelector/index.ts"
import { syntaxKeepsInlineComments } from "../../utils/readsInlineComments/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.ts"
import { isAtRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"
import { assertString, isBoolean } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `string-quotes`

const MESSAGES = defineMessages({
	expected: (q) => `Expected ${q} quotes`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

const SINGLE_QUOTE = `'`
const DOUBLE_QUOTE = `"`

/**
 * Specifies single or double quotes around strings.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `single` and `double`.
 * @param secondaryOptions - The secondary options: `avoidEscape`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `single` | `double`, secondaryOptions: { avoidEscape?: boolean }): RuleCheck {
	let correctQuote: typeof SINGLE_QUOTE | typeof DOUBLE_QUOTE = primary === `single` ? SINGLE_QUOTE : DOUBLE_QUOTE

	let erroneousQuote: typeof SINGLE_QUOTE | typeof DOUBLE_QUOTE = primary === `single` ? DOUBLE_QUOTE : SINGLE_QUOTE

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

		// A double slash opens a comment only where the syntax says it does. Elsewhere it is part of a value — an address, most often — and reading it as a comment would silence every string behind it on the line. The two spellings are identical, so the text cannot answer this and the syntax has to. The question waits until a double slash turns up, since answering it costs two parses of a probe and most stylesheets never ask.
		//
		// A stylesheet embedded in a page carries the syntax of its own block, and it is that one the question belongs to: the syntax the file was opened with parses the page rather than the style, and one page may hold blocks written in several languages.
		let blockSyntax = nodeSyntax(root, result)

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
		 * @param ruleNode - The rule node to check.
		 */
		function checkRule (ruleNode: Rule): void {
			if (!syntax.isStandardRule(ruleNode)) return

			let selectorRaws: SyntaxRaw | undefined = ruleNode.raws.selector

			// `ruleNode.selector` is a copy with every comment taken out, so a position counted in it stands short of the file wherever a comment goes before, and a fix written to it prints without the comments. The raw is the text the file holds — except under `postcss-scss`, which spells every inline comment of the raw as a block one and keeps the file's spelling beside it, two characters shorter per comment. The raw is what is parsed here, every position is translated back into the file's coordinates, and a fix is written to both copies.
			let selector = selectorRaws ? selectorRaws.raw : ruleNode.selector

			if (!selector.includes(`[`) || !selector.includes(`=`)) return

			let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)
			let selectorFixed = false

			let selectorTree = parseSelector(selector, result, ruleNode)

			if (!selectorTree) return

			selectorTree.walkAttributes((attributeNode) => {
				if (!attributeNode.quoted) return

				let maybeProblemIndex = toSelectorSourceIndex(attributeNode.sourceIndex + attributeNode.offsetOf(`value`), inlineComments)

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

			if (selectorFixed) {
				let fixedSelector = String(selectorTree)

				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it.
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else ruleNode.selector = fixedSelector
			}
		}

		/**
		 * Checks a declaration or at-rule node for quote violations.
		 * @param node - The node to check.
		 * @param rawValue - The value to check, as the raws of the node record it.
		 * @param getIndex - Function to get the index of the node.
		 */
		function checkDeclOrAtRule<T extends AtRule | Declaration> (node: T, rawValue: string, getIndex: (node: T) => number): void {
			let fixPositions: number[] = []

			let raws: SyntaxRaw | undefined = isAtRule(node) ? node.raws.params : node.raws.value

			// `postcss-scss` rewrites every `//` comment inside the raw into a block comment, keeps the spelling of the file in a copy of its own and prints that copy. The rule works in that copy, since it is the file it reports positions in and the text a fix has to reach.
			let value = (raws && raws.scss) || rawValue

			// Get out quickly if there are no erroneous quotes
			if (!value.includes(erroneousQuote)) return

			// The comments the syntax rewrote in the raw are the comments it found, and the two copies say between them where each of them runs. They say it only while both still measure the same text: a rule that has written to one of them and left the other behind takes that away, and the text is then scanned as one carrying no such pair at all.
			let rewrittenSpans = raws && raws.scss ? findRewrittenCommentSpans(raws.raw, raws.scss) : null
			let inlineCommentSpans = rewrittenSpans || scanCommentSpans(raws, value)

			if (isAtRule(node) && node.name === `charset`) {
				let hasValidQuotes = node.params.startsWith(`"`) && node.params.endsWith(`"`)

				// pass through to the fixer only if the primary option is "double"
				if (hasValidQuotes || correctQuote === `'`) return
			}

			valueParser(blankComments(value, inlineCommentSpans)).walk((valueNode) => {
				if (valueNode.type === `string` && valueNode.quote === erroneousQuote) {
					let needsEscape = valueNode.value.includes(correctQuote)

					if (avoidEscape && needsEscape) {
						// don't consider this an error
						return
					}

					let openIndex = valueNode.sourceIndex
					let problemIndex = getIndex(node) + openIndex

					report({
						message: messages.expected,
						messageArgs: [primary],
						node,
						index: problemIndex,
						endIndex: problemIndex,
						result,
						ruleName,
						fix () {
							// An escape is left as the file spells it
							if (!needsEscape) {
								let closeIndex = openIndex + valueNode.value.length + erroneousQuote.length

								fixPositions.push(openIndex, closeIndex)
							}
						},
					})
				}
			})

			if (fixPositions.length === 0) return

			// The copy spelled as the file spells it is the one that is printed, so the fix goes there; the raw beside it is kept in step with it, for the rules that come after — as far as the two still measure the same text and a position can be carried between them.
			if (raws && raws.scss) {
				raws.scss = replaceQuotes(value, fixPositions)

				if (rewrittenSpans) raws.raw = replaceQuotes(raws.raw, fixPositions.map((fixIndex) => toRewrittenIndex(fixIndex, rewrittenSpans)))

				return
			}

			let fixed = replaceQuotes(value, fixPositions)

			if (isAtRule(node)) setAtRuleParams(node, fixed)
			else setDeclarationValue(node, fixed)
		}

		/**
		 * Scans a value for the inline comments it carries, where nothing else says where they are. `postcss-less` leaves the `//` comment of a variable spanning more than one line inside the params, where the value tokenizer takes the quotes in its text for a string of code.
		 * @param raws - The raws of the value, if it has any.
		 * @param value - The value, as the file spells it.
		 * @returns The spans, in the coordinates of the value.
		 */
		function scanCommentSpans (raws: SyntaxRaw | undefined, value: string): InlineCommentSpan[] {
			if (!value.includes(`//`)) return []

			// A double slash of a syntax that marks its comments in a copy of its own is code — part of an address, most often. Unless that copy has gone out of step with the value and left the scan to answer after all, and then the comments are the ones the text spells.
			if (!(raws && raws.scss) && !syntaxKeepsInlineComments(blockSyntax)) return []

			return findInlineCommentSpans(value)
		}

		/**
		 * Replaces the quotation marks a text carries at the given indexes with the correct one.
		 * @param text - The text to fix.
		 * @param indexes - The indexes of the quotation marks, in the coordinates of the text.
		 * @returns The fixed text.
		 */
		function replaceQuotes (text: string, indexes: number[]): string {
			let fixed = text

			for (let index of indexes) fixed = replaceQuote(fixed, index, correctQuote)

			return fixed
		}
	}
}

/**
 * Finds the spans the inline comments of a value occupy in it, out of the two copies `postcss-scss` keeps of that value: one with every inline comment rewritten into a block comment, and one spelled as the file spells it. Only the comments set the two apart, so the first character they disagree on is the second character of one — the asterisk of a block comment against the second slash of an inline one. A comment ends with its line in both copies, and none of them holds a line break, so the next line break puts the two back in step whatever the rewriting did to the text in between, and the distance between them there is what a position behind the comment has to be moved by to be read in the rewritten copy.
 *
 * Everything here rests on the two copies being the two copies of one text, which holds only until a rule writes to one of them and leaves the other where it was — a line break of the raw taken away, a colour spelled differently in it, a space put in front of it. The reading is therefore checked against the raw before it is handed out, by rewriting the comments it found the way the syntax rewrote them, and nothing is returned unless the raw comes back character for character.
 * @param rewritten - The copy the comments were rewritten in.
 * @param spelled - The copy spelled as the file spells it.
 * @returns The spans, in the coordinates of the spelled copy, or `null` if the two copies have gone out of step.
 */
function findRewrittenCommentSpans (rewritten: string, spelled: string): InlineCommentSpan[] | null {
	let spans: InlineCommentSpan[] = []
	let rewrittenIndex = 0
	let spelledIndex = 0

	while (rewrittenIndex < rewritten.length && spelledIndex < spelled.length) {
		if (rewritten[rewrittenIndex] === spelled[spelledIndex]) {
			rewrittenIndex += 1
			spelledIndex += 1

			continue
		}

		// The asterisk of a block comment against the second slash of an inline one, and the first slash of both already behind. Anything else is two texts that have parted ways.
		if (spelledIndex === 0 || rewritten[rewrittenIndex] !== `*` || spelled[spelledIndex] !== `/` || spelled[spelledIndex - 1] !== `/`) return null

		let lineBreakIndex = spelled.indexOf(`\n`, spelledIndex)
		let rewrittenLineBreakIndex = rewritten.indexOf(`\n`, rewrittenIndex)
		let runsToTheEnd = lineBreakIndex === -1 || rewrittenLineBreakIndex === -1

		spans.push({
			start: spelledIndex - 1,
			end: runsToTheEnd ? spelled.length : lineBreakIndex,
			delta: runsToTheEnd ? rewritten.length - spelled.length : rewrittenLineBreakIndex - lineBreakIndex,
		})

		if (runsToTheEnd) break

		spelledIndex = lineBreakIndex
		rewrittenIndex = rewrittenLineBreakIndex
	}

	// A reading of one copy against the other proves nothing by itself: the walk above sees where the two part company, not whether they ever meant the same text. Rewriting the comments it found the way the syntax rewrites them does prove it — the raw comes back or it does not.
	return rewriteInlineComments(spelled, spans) === rewritten ? spans : null
}

/**
 * Moves a position of the value into the copy of it a syntax rewrote the comments in.
 * @param index - The position, in the coordinates of the value.
 * @param spans - The spans of the inline comments the value carries.
 * @returns The position, in the coordinates of the rewritten copy.
 */
function toRewrittenIndex (index: number, spans: InlineCommentSpan[]): number {
	let delta = 0

	// A position inside a comment is not one the rule ever fixes, so every span the position does not stand behind is passed over.
	for (let span of spans) {
		if (index < span.end) break

		delta = span.delta || 0
	}

	return index + delta
}

/**
 * Replaces a quote character in a string at the specified index.
 * @param string - The input string.
 * @param index - The index at which to replace the quote.
 * @param replace - The replacement quote character.
 * @returns The string with the quote replaced.
 */
function replaceQuote (string: string, index: number, replace: string): string {
	return string.slice(0, index) + replace + string.slice(index + replace.length)
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
