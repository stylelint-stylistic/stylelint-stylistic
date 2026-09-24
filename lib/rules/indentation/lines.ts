import type { AtRule, Declaration, Node, Rule } from "postcss"
import styleSearch from "style-search"

import { CRLF, LEADING_CLOSING_BRACE, LEADING_CLOSING_PARENTHESIS, LEADING_INDENT_AND_CONTENT, LINE_BREAK, OPENING_BRACE_AT_END, OPENING_PARENTHESIS_AT_END, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { atRuleHead } from "../../utils/atRuleHead/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { replaceIndentation } from "../../utils/lineIndentation/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { report } from "../../utils/report/index.ts"
import { isAtRule, isDeclaration, isRoot, isRule } from "../../utils/typeGuards/index.ts"
import { isString } from "../../utils/validateTypes/index.ts"

import type { IndentationScope } from "./scope.ts"

/** A line to re-indent: its whitespace, the whitespace asked for, and its break's index. */
type FixPosition = {
	expectedIndentation: string,
	currentIndentation: string,
	startIndex: number,
}

/**
 * Writes a declaration's indentation, each line into the copy of the declaration that holds it.
 *
 * Positions are counted from the declaration's start through the property, `raws.between`, the value and the bang's `raws.important`, which holds a break standing in front of the flag or inside it. Written onto the end of the value, where the writer knew `raws.between` and the value alone, the value grew a level every run.
 *
 * The property is written as `decl.prop`, the only copy of it a node carries: PostCSS builds a `raws` copy of the params, the value and the selector and of nothing else. A break reaches it inside the `#{…}` of an interpolated property, which `postcss-scss` reads and `postcss-html` reads too, in a `style` attribute as much as in a `<style lang="scss">`, so the core's rule meets one as well. Counted from the property's end such a position is negative, and `replaceIndentation` then built the text out of two slices taken from the end of `raws.between`: the indentation landed behind the interpolation, and where the two slices did not meet the leading colon went with them and the file stopped parsing.
 * @param decl - The declaration.
 * @param fixPositions - The positions, in reverse order.
 * @param syntax - The syntax that reads and writes the value.
 */
function writeDeclarationIndentation (decl: Declaration, fixPositions: FixPosition[], syntax: Syntax): void {
	let declBetween = decl.raws.between

	if (!isString(declBetween)) throw new TypeError(`The \`between\` property must be a string`)

	let declValue = syntax.read(decl)

	// Written from the end, so no write moves these boundaries
	let propEndIndex = decl.prop.length
	let valueStartIndex = propEndIndex + declBetween.length
	let valueEndIndex = valueStartIndex + declValue.length

	for (let fixPosition of fixPositions) {
		if (fixPosition.startIndex < propEndIndex) {
			decl.prop = replaceIndentation(decl.prop, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex)
		}
		else if (fixPosition.startIndex < valueStartIndex) {
			decl.raws.between = replaceIndentation(decl.raws.between || ``, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - propEndIndex)
		}
		else if (fixPosition.startIndex < valueEndIndex) {
			declValue = replaceIndentation(declValue, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - valueStartIndex)

			syntax.write(decl, declValue)
		}
		else {
			let flag = decl.raws.important

			// Reached only behind a break the raw holds, so the ` !important` PostCSS leaves no raw for never comes here
			if (isString(flag)) decl.raws.important = replaceIndentation(flag, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - valueEndIndex)
		}
	}
}

/**
 * Writes an at-rule's indentation, each line into its raw.
 *
 * Positions are counted from the at-rule's start through `raws.afterName`, the params, `raws.between`, a Less mixin call's `raws.important` and, behind a stylesheet's last at-rule, the root's `raws.after`. A line in `raws.between` is one the at-rule swallowed ([#510](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/510)); written onto the end of the params, the file grew a level every run ([#375](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375)).
 * @param atRule - The at-rule.
 * @param fixPositions - The positions, in reverse order.
 * @param syntax - The syntax that reads and writes the params.
 */
function writeAtRuleIndentation (atRule: AtRule, fixPositions: FixPosition[], syntax: Syntax): void {
	let atRuleAfterName = atRule.raws.afterName
	let atRuleParams = syntax.read(atRule)

	if (!isString(atRuleAfterName)) throw new TypeError(`The \`afterName\` property must be a string`)

	// 1 for the `@`
	let paramsStartIndex = 1 + atRule.name.length + atRuleAfterName.length

	// Written from the end, so no write moves this boundary
	let paramsEndIndex = paramsStartIndex + atRuleParams.length

	for (let fixPosition of fixPositions) {
		if (fixPosition.startIndex < paramsStartIndex) {
			atRuleAfterName = replaceIndentation(atRuleAfterName, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - atRule.name.length - 1)
			atRule.raws.afterName = atRuleAfterName
		}
		else if (fixPosition.startIndex < paramsEndIndex) {
			atRuleParams = replaceIndentation(atRuleParams, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - paramsStartIndex)
			syntax.write(atRule, atRuleParams)
		}
		else {
			let atRuleBetween = atRule.raws.between

			// Reached only behind a break the raw holds
			if (!isString(atRuleBetween)) throw new TypeError(`The \`between\` property must be a string`)

			let betweenIndex = fixPosition.startIndex - paramsEndIndex
			let flag = typeof atRule.raws.important === `string` ? atRule.raws.important : ``
			let flagIndex = betweenIndex - atRuleBetween.length

			// A Less mixin call's flag and, in a block, the lines behind it are printed behind `raws.between` (#374); behind a stylesheet's last at-rule the lines are the root's `raws.after`, printed behind both (#592)
			if (flagIndex >= flag.length && atRule.parent && isRoot(atRule.parent)) atRule.parent.raws.after = replaceIndentation(atRule.parent.raws.after || ``, fixPosition.currentIndentation, fixPosition.expectedIndentation, flagIndex - flag.length)
			else if (flagIndex >= 0 && flag) atRule.raws.important = replaceIndentation(flag, fixPosition.currentIndentation, fixPosition.expectedIndentation, flagIndex)
			else atRule.raws.between = replaceIndentation(atRuleBetween, fixPosition.currentIndentation, fixPosition.expectedIndentation, betweenIndex)
		}
	}
}

/** The brackets opened at the ends of the lines read so far, and what the first line's parentheses take off. */
type OpenBrackets = {
	parentheses: number,
	braces: number,
	firstLineDiscount: number,
}

/**
 * The levels a line inside parentheses stands deeper than the text's own, and the counts it leaves for the next line.
 * @param scope - The run.
 * @param opened - The brackets opened so far, updated for the next line.
 * @param line - The text, its search copy, the node, whether the first line's parentheses are paid for, the break, whether it is the first, and whether a `)` opens the line behind it.
 * @param line.source - The text.
 * @param line.searchString - The search copy of the text.
 * @param line.node - The node the text is read from.
 * @param line.firstLineParenthesesArePaidFor - Whether the measuring level already pays for the first line's parentheses.
 * @param line.startIndex - The break's index.
 * @param line.isFirst - Whether the break closes the text's first line.
 * @param line.precedesClosingParenthesis - Whether a `)` opens the line behind the break.
 * @returns The levels to add.
 */
function levelsInsideParens (scope: IndentationScope, opened: OpenBrackets, { source, searchString, node, firstLineParenthesesArePaidFor, startIndex, isFirst, precedesClosingParenthesis }: {
	source: string,
	searchString: string,
	node: Node,
	firstLineParenthesesArePaidFor: boolean,
	startIndex: number,
	isFirst: boolean,
	precedesClosingParenthesis: boolean,
}): number {
	let { secondaryOptions } = scope
	let indentClosingBrace = secondaryOptions.indentClosingBrace

	// The first line's parentheses are paid for
	if (isFirst && firstLineParenthesesArePaidFor) opened.firstLineDiscount = -1

	// A Windows pair's line ends in front of the carriage return
	let lineEndIndex = startIndex > 0 && CRLF.test(source.slice(startIndex - 1, startIndex + 1)) ? startIndex - 1 : startIndex

	// A trailing comment must not hide the `(`; the copy blanks the inline kind
	let followsOpeningParenthesis = OPENING_PARENTHESIS_AT_END.test(searchString.slice(0, lineEndIndex))

	if (followsOpeningParenthesis) opened.parentheses += 1

	let followsOpeningBrace = OPENING_BRACE_AT_END.test(source.slice(0, lineEndIndex))

	if (followsOpeningBrace) opened.braces += 1

	let startingClosingBrace = LEADING_CLOSING_BRACE.test(source.slice(startIndex + 1))

	// A closing brace lowers its own line: unwound before the level is read
	if (startingClosingBrace && opened.braces > 0) opened.braces -= 1

	let levels = opened.firstLineDiscount + opened.parentheses + opened.braces

	let unwindsParenthesisOpenedAtLineEnd = precedesClosingParenthesis && opened.parentheses > 0

	// From here the counts speak of the next line
	if (unwindsParenthesisOpenedAtLineEnd) opened.parentheses -= 1

	// `once-at-root-twice-in-block`: once at the root, as the default
	let indentsTwice = secondaryOptions.indentInsideParens === `twice` || (secondaryOptions.indentInsideParens === `once-at-root-twice-in-block` && node.parent !== node.root())

	if (indentsTwice) {
		if (!precedesClosingParenthesis || indentClosingBrace) levels += 1
	}
	else if (unwindsParenthesisOpenedAtLineEnd && !indentClosingBrace) levels -= 1

	return levels
}

/**
 * Checks the indentation of a text's lines after the first.
 * @param scope - The run.
 * @param source - The text.
 * @param newlineIndentLevel - The level asked for.
 * @param node - The node the text is read from and written back to.
 * @param nodeLevel - The node's level.
 * @param offset - Where the text starts in the node; positions are counted from there.
 */
function checkMultilineBit (scope: IndentationScope, source: string, newlineIndentLevel: number, node: Node, nodeLevel: number, offset: number = 0): void {
	if (!LINE_BREAK.test(source)) return

	let { syntax, result, ruleName, messages, secondaryOptions, indentChar, legibleExpectation } = scope

	// The search runs over a copy with every comment blanked: `style-search` reads the break closing an inline comment as part of it (#236). The copy's positions are the file's. Below, only the one test whose pattern spells a block comment out reads the copy
	let { searchString } = syntax.searchCopy(source, node, result)

	let fixPositions: FixPosition[] = []

	// Breaks inside parentheses are turned away below where the option asks, for a Sass map's sake. Only a bracket opened at a line's end raises the lines behind it, so a bracket opening a line unwinds one only while such a one is open. Counts, not a stack, so a mid-line closer can spend a line-end opener. Braces and parentheses apart: a brace lowers the line it closes on, a parenthesis the line after (#237). The first line's discount is off where the measuring level already pays for the first line's brackets
	let opened: OpenBrackets = { parentheses: 0, braces: 0, firstLineDiscount: 0 }

	let ignoreInsideParens = optionsMatches(secondaryOptions, `ignore`, `inside-parens`)

	// Where the text is measured a level above its node, its first line's parentheses are paid for. A selector, params under `except: ["param"]` or behind `@nest`/`@at-root`, and a value under `except: ["value"]` are not; there the discount took a line inside them a step too low (#30, #74, #237)
	let firstLineParenthesesArePaidFor = newlineIndentLevel > nodeLevel

	styleSearch(
		{
			source: searchString,
			target: `\n`,
		},
		(match, matchCount) => {
			let precedesClosingParenthesis = LEADING_CLOSING_PARENTHESIS.test(source.slice(match.startIndex + 1))

			if (ignoreInsideParens && (precedesClosingParenthesis || match.insideParens)) return

			// Inside parentheses
			let expectedIndentLevel = newlineIndentLevel + (!ignoreInsideParens && match.insideParens ? levelsInsideParens(scope, opened, { source, searchString, node, firstLineParenthesesArePaidFor, startIndex: match.startIndex, isFirst: matchCount === 1, precedesClosingParenthesis }) : 0)

			// In the text, not the copy, where a comment-only line is all blanks
			let afterNewlineSpaceMatches = LEADING_INDENT_AND_CONTENT.exec(source.slice(match.startIndex + 1))

			if (!afterNewlineSpaceMatches) return

			let afterNewlineSpace = afterNewlineSpaceMatches[1] || ``
			let expectedIndentation = indentChar.repeat(Math.max(expectedIndentLevel, 0))

			if (afterNewlineSpace !== expectedIndentation) {
				let problemIndex = offset + match.startIndex + afterNewlineSpace.length + 1

				report({
					message: messages.expected,
					messageArgs: [legibleExpectation(expectedIndentLevel)],
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						// Reverse order, since a write at a line's head moves every position behind it; none lands inside an inline comment
						fixPositions.unshift({
							expectedIndentation,
							currentIndentation: afterNewlineSpace,
							startIndex: offset + match.startIndex,
						})
					},
				})
			}
		},
	)

	if (fixPositions.length > 0) {
		if (isRule(node)) {
			let fixedSelector = syntax.read(node)

			for (let fixPosition of fixPositions) {
				fixedSelector = replaceIndentation(
					fixedSelector,
					fixPosition.currentIndentation,
					fixPosition.expectedIndentation,
					fixPosition.startIndex,
				)
			}

			syntax.write(node, fixedSelector)
		}

		if (isDeclaration(node)) writeDeclarationIndentation(node, fixPositions, syntax)

		if (isAtRule(node)) writeAtRuleIndentation(node, fixPositions, syntax)
	}
}

/**
 * Checks the lines of a declaration's value.
 * @param scope - The run.
 * @param decl - The declaration.
 * @param declLevel - The indent level the declaration stands at.
 */
export function checkValue (scope: IndentationScope, decl: Declaration, declLevel: number): void {
	let { syntax, secondaryOptions } = scope

	if (syntax.valueEmbedsHostCode(decl)) return

	if (optionsMatches(secondaryOptions, `ignore`, `value`)) return

	let declString = declarationString(syntax, decl)

	// Asked of the whole text the lines are then measured in, since a break stands in any of the four copies it is printed from: in front of the value or of the colon in `raws.between` (#635), inside the `#{…}` of an interpolated property in `prop`, and in front of the bang or inside the flag in `raws.important`
	if (!LINE_BREAK.test(declString)) return

	let valueLevel = optionsMatches(secondaryOptions, `except`, `value`) ? declLevel : declLevel + 1

	checkMultilineBit(scope, declString, valueLevel, decl, declLevel)
}

/**
 * Checks the lines of a selector.
 * @param scope - The run.
 * @param ruleNode - The rule whose selector is read.
 * @param ruleLevel - The indent level the rule stands at.
 */
export function checkSelector (scope: IndentationScope, ruleNode: Rule, ruleLevel: number): void {
	let { syntax, secondaryOptions } = scope

	// A Less mixin definition's head is measured as an at-rule's params are, `except` and `ignore` of `param` included (#651); the fix writes to the file's copy
	if (!(syntax.readsRuleParams(ruleNode) && optionsMatches(secondaryOptions, `ignore`, `param`))) checkMultilineBit(scope, syntax.read(ruleNode), syntax.readsRuleParams(ruleNode) && !optionsMatches(secondaryOptions, `except`, `param`) ? ruleLevel + 1 : ruleLevel, ruleNode, ruleLevel)
}

/**
 * Checks the lines of an at-rule's params and the lines it swallowed.
 * @param scope - The run.
 * @param atRule - The at-rule.
 * @param ruleLevel - The indent level the at-rule stands at.
 */
export function checkAtRuleParams (scope: IndentationScope, atRule: AtRule, ruleLevel: number): void {
	let { syntax, secondaryOptions, result } = scope

	// The head ends where the params' code does; a comment the parser left behind it in the params opens the swallowed lines (1788576696), which are the block's, asked for the at-rule's own level whatever `except` and `ignore` say: measured with the params, `--fix` put a comment there a level deeper (#510)
	let { head, swallowedLines } = atRuleHead(syntax, atRule, result)

	// `@nest` and `@at-root` params are selectors
	let paramLevel = optionsMatches(secondaryOptions, `except`, `param`) || atRule.name === `nest` || atRule.name === `at-root` ? ruleLevel : ruleLevel + 1

	// Positions are counted from the at-rule's start, filed into the raws by the head's length. Swallowed lines first, since a re-indented params line would move that boundary
	if (swallowedLines) checkMultilineBit(scope, swallowedLines, ruleLevel, atRule, ruleLevel, head.length)

	// With nothing swallowed, `raws.between` is measured with the params, trimmed as the tokenizer reads whitespace, since a vertical tab or a no-break space alone on the last line is a word (1789421331)
	if (!optionsMatches(secondaryOptions, `ignore`, `param`)) checkMultilineBit(scope, `${head}${swallowedLines ? `` : atRule.raws.between || ``}`.replace(TRAILING_CSS_WHITESPACE, ``), paramLevel, atRule, ruleLevel)
}
