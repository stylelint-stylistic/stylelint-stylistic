import type { AtRule, Declaration, Document, Node, Root, Rule, Source } from "postcss"
import styleSearch from "style-search"
import stylelint from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_LINE_BREAK_AND_INDENT, EVERY_LINE_INDENT_WITH_CONTENT, EVERY_LINE_SPACE_INDENT, EVERY_SPACE, EVERY_TAB, LEADING_CLOSING_BRACE, LEADING_CLOSING_PARENTHESIS, LEADING_INDENT_AND_CONTENT, LEADING_SPACES_AND_TABS, LINE_BREAK, OPENING_BRACE_AT_END, OPENING_PARENTHESIS_AT_END, OPENS_WITH_TAG, TRAILING_LINE_BREAK, TRAILING_STAR_OR_UNDERSCORE, TRAILING_WHITESPACE, WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getBlockAfter } from "../../utils/getBlockAfter/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isLastNodeWithoutSemicolon } from "../../utils/isLastNodeWithoutSemicolon/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import { rootLevelIndents } from "../../utils/rootLevelIndents/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { setBlockAfter } from "../../utils/setBlockAfter/index.ts"
import { isAtRule, isDeclaration, isRoot, isRule } from "../../utils/typeGuards/index.ts"
import { assertString, isBoolean, isNumber, isString } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `indentation`

const MESSAGES = defineMessages({
	expected: (x) => `Expected indentation of ${x}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The secondary options. */
type SecondaryOptions = {
	baseIndentLevel?: number | `auto`,
	except?: (`block` | `value` | `param`)[],
	ignore?: (`value` | `param` | `inside-parens`)[],
	indentInsideParens?: `twice` | `once-at-root-twice-in-block`,
	indentClosingBrace?: boolean,
}

/**
 * Specifies indentation.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - A number of spaces, or `tab`.
 * @param secondaryOptions - `baseIndentLevel`, `except`, `ignore`, `indentInsideParens` and `indentClosingBrace`.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: number | `tab`, secondaryOptions: SecondaryOptions = {}): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{
				actual: primary,
				possible: [isNumber, `tab`],
			},
			{
				actual: secondaryOptions,
				possible: {
					baseIndentLevel: [isNumber, `auto`],
					except: [`block`, `value`, `param`],
					ignore: [`value`, `param`, `inside-parens`],
					indentInsideParens: [`twice`, `once-at-root-twice-in-block`],
					indentClosingBrace: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let spaceCount = isNumber(primary) ? primary : null
		let indentChar = spaceCount === null ? `\t` : ` `.repeat(spaceCount)
		let warningWord = primary === `tab` ? `tab` : `space`

		let baseIndentLevel = secondaryOptions.baseIndentLevel
		let indentClosingBrace = secondaryOptions.indentClosingBrace

		/**
		 * Words a level as a count of tabs or spaces.
		 * @param level - The indent level to word, counted in units of the indent.
		 * @returns The text.
		 */
		function legibleExpectation (level: number): string {
			let count = spaceCount === null ? level : level * spaceCount
			let quantifiedWarningWord = count === 1 ? warningWord : `${warningWord}s`

			return `${count} ${quantifiedWarningWord}`
		}

		root.walk((node) => {
			if (isRoot(node)) {
				// A nested root of a CSS-in-JS template
				return
			}

			let nodeLevel = indentationLevel(node)
			let { hostLevel, embeddedLevel } = embeddingLevel(syntax, node, indentChar)

			// The `*` and `_` hacks are not indentation
			let before = (node.raws.before || ``).replace(TRAILING_STAR_OR_UNDERSCORE, ``)
			let parent = node.parent

			if (!parent) throw new Error(`A parent node must be present`)

			// Only the root's first node, or one behind a break, has indentation to check
			let isFirstChild = parent.type === `root` && parent.first === node
			// The last line of `before` is the indentation, a form feed or bare carriage return as much as a space; the writers below read the same run (#452)
			let beforeLines = before.split(EVERY_LINE_BREAK)
			let indentationBefore = beforeLines.at(-1)

			// A first node with no break in front stands on the stylesheet's opening line and is asked to be empty, not for the host line's tabs (#453). A bare carriage return ends a JavaScript line and none of the stylesheet's, so a node behind one still stands there
			let opensTheStylesheetsLine = isFirstChild && beforeLines.length === 1
			let expectedOpeningBraceLevel = opensTheStylesheetsLine ? nodeLevel - embeddedLevel : nodeLevel
			let expectedOpeningBraceIndentation = indentChar.repeat(expectedOpeningBraceLevel)

			if ((beforeLines.length > 1 || (isFirstChild && (!getDocument(parent) || (parent.raws.codeBefore && TRAILING_LINE_BREAK.test(parent.raws.codeBefore))))) && indentationBefore !== expectedOpeningBraceIndentation) {
				report({
					message: messages.expected,
					messageArgs: [legibleExpectation(expectedOpeningBraceLevel - (opensTheStylesheetsLine ? 0 : hostLevel))],
					node,
					result,
					ruleName,
					fix () {
						if (!isString(node.raws.before)) return

						node.raws.before = fixIndentation(isFirstChild ? node.raws.before.replace(WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT, expectedOpeningBraceIndentation) : node.raws.before, expectedOpeningBraceIndentation)
					},
				})
			}

			// `indentClosingBrace` puts the brace a level deeper
			let closingBraceLevel = indentClosingBrace ? nodeLevel + 1 : nodeLevel
			let expectedClosingBraceIndentation = indentChar.repeat(closingBraceLevel)
			// Read wherever the parser filed the run: behind an at-rule with neither block nor semicolon it is in `raws.between`, trimmed by `checkAtRuleParams`, so nobody measured the brace's line (#509)
			let blockAfter = isRule(node) || isAtRule(node) ? getBlockAfter(node) ?? `` : ``
			let afterLines = blockAfter.split(EVERY_LINE_BREAK)

			if ((isRule(node) || isAtRule(node)) && hasBlock(node) && afterLines.length > 1 && afterLines.at(-1) !== expectedClosingBraceIndentation) {
				let problemIndex = nodeString(node, result).length - 1

				report({
					message: messages.expected,
					messageArgs: [legibleExpectation(closingBraceLevel - hostLevel)],
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						setBlockAfter(node, fixIndentation(blockAfter, expectedClosingBraceIndentation))
					},
				})
			}

			if (isDeclaration(node)) checkValue(node, nodeLevel)

			if (isRule(node)) checkSelector(node, nodeLevel)

			if (isAtRule(node)) checkAtRuleParams(node, nodeLevel)
		})

		/**
		 * The level a node stands at.
		 * @param node - The node whose ancestors are counted.
		 * @param level - The levels so far.
		 * @returns The level.
		 */
		function indentationLevel (node: Node, level: number = 0): number {
			if (!node.parent) throw new Error(`A parent node must be present`)

			let calculatedLevel = level + embeddingLevel(syntax, node, indentChar).embeddedLevel

			if (isRoot(node.parent)) return calculatedLevel + getRootBaseIndentLevel(node.parent, baseIndentLevel, primary, indentClosingBrace)

			// One level per ancestor
			calculatedLevel = indentationLevel(node.parent, calculatedLevel + 1)

			// Under `except: ["block"]` a block stands at its parent's level
			if (optionsMatches(secondaryOptions, `except`, `block`) && (isRule(node) || isAtRule(node)) && hasBlock(node)) calculatedLevel -= 1

			return calculatedLevel
		}

		/**
		 * Checks the lines of a declaration's value.
		 * @param decl - The declaration.
		 * @param declLevel - The indent level the declaration stands at.
		 */
		function checkValue (decl: Declaration, declLevel: number): void {
			if (!LINE_BREAK.test(decl.value)) return

			if (syntax.valueEmbedsHostCode(decl)) return

			if (optionsMatches(secondaryOptions, `ignore`, `value`)) return

			let declString = declarationString(syntax, decl)
			let valueLevel = optionsMatches(secondaryOptions, `except`, `value`) ? declLevel : declLevel + 1

			checkMultilineBit(declString, valueLevel, decl, declLevel)
		}

		/**
		 * Checks the lines of a selector.
		 * @param ruleNode - The rule whose selector is read.
		 * @param ruleLevel - The indent level the rule stands at.
		 */
		function checkSelector (ruleNode: Rule, ruleLevel: number): void {
			// Less mixin params stand a level deeper; the fix writes to the file's copy
			checkMultilineBit(syntax.read(ruleNode), syntax.readsRuleParams(ruleNode) ? ruleLevel + 1 : ruleLevel, ruleNode, ruleLevel)
		}

		/**
		 * Checks the lines of an at-rule's params and the lines it swallowed.
		 * @param atRule - The at-rule.
		 * @param ruleLevel - The indent level the at-rule stands at.
		 */
		function checkAtRuleParams (atRule: AtRule, ruleLevel: number): void {
			let head = `@${atRule.name}${atRule.raws.afterName || ``}${syntax.read(atRule)}`

			// With neither block nor semicolon an at-rule runs to its block's closing brace, and PostCSS puts everything in between into `raws.between`. Such a line is the block's, asked for the at-rule's own level whatever `except` and `ignore` say; measured with the params, `--fix` put a comment there a level deeper (#510). The tree is read as it stands, so a neighbour's semicolon moves the comment at once. The trailing whitespace is the run in front of the brace, `getBlockAfter`'s (#509)
			let swallowedLines = !hasBlock(atRule) && isLastNodeWithoutSemicolon(atRule) ? (atRule.raws.between || ``).replace(TRAILING_WHITESPACE, ``) : ``

			// `@nest` and `@at-root` params are selectors
			let paramLevel = optionsMatches(secondaryOptions, `except`, `param`) || atRule.name === `nest` || atRule.name === `at-root` ? ruleLevel : ruleLevel + 1

			// Positions are counted from the at-rule's start, filed into the raws by the head's length. Swallowed lines first, since a re-indented params line would move that boundary
			if (swallowedLines) checkMultilineBit(swallowedLines, ruleLevel, atRule, ruleLevel, head.length)

			// With nothing swallowed, `raws.between` is measured with the params, trimmed
			if (!optionsMatches(secondaryOptions, `ignore`, `param`)) checkMultilineBit(`${head}${swallowedLines ? `` : atRule.raws.between || ``}`.trim(), paramLevel, atRule, ruleLevel)
		}

		/**
		 * Checks the indentation of a text's lines after the first.
		 * @param source - The text.
		 * @param newlineIndentLevel - The level asked for.
		 * @param node - The node the text is read from and written back to.
		 * @param nodeLevel - The node's level.
		 * @param offset - Where the text starts in the node; positions are counted from there.
		 */
		function checkMultilineBit (source: string, newlineIndentLevel: number, node: Node, nodeLevel: number, offset: number = 0): void {
			if (!LINE_BREAK.test(source)) return

			// The search runs over a copy with every comment blanked: `style-search` reads the break closing an inline comment as part of it (#236). The copy's positions are the file's. Below, only the one test whose pattern spells a block comment out reads the copy
			let { searchString } = syntax.searchCopy(source, node, result)

			let fixPositions: FixPosition[] = []

			// Breaks inside parentheses are turned away below where the option asks, for a Sass map's sake. Only a bracket opened at a line's end raises the lines behind it, so a bracket opening a line unwinds one only while such a one is open. Counts, not a stack, so a mid-line closer can spend a line-end opener. Braces and parentheses apart: a brace lowers the line it closes on, a parenthesis the line after (#237)
			let openParenthesesAtLineEnds = 0
			let openBracesAtLineEnds = 0

			// Off where the measuring level already pays for the first line's brackets
			let firstLineDiscount = 0

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

					let expectedIndentLevel = newlineIndentLevel

					// Inside parentheses
					if (!ignoreInsideParens && match.insideParens) {
						// The first line's parentheses are paid for
						if (matchCount === 1 && firstLineParenthesesArePaidFor) firstLineDiscount = -1

						// A Windows pair's line ends in front of the carriage return
						let lineEndIndex = match.startIndex > 0 && CRLF.test(source.slice(match.startIndex - 1, match.startIndex + 1)) ? match.startIndex - 1 : match.startIndex

						// A trailing comment must not hide the `(`; the copy blanks the inline kind
						let followsOpeningParenthesis = OPENING_PARENTHESIS_AT_END.test(searchString.slice(0, lineEndIndex))

						if (followsOpeningParenthesis) openParenthesesAtLineEnds += 1

						let followsOpeningBrace = OPENING_BRACE_AT_END.test(source.slice(0, lineEndIndex))

						if (followsOpeningBrace) openBracesAtLineEnds += 1

						let startingClosingBrace = LEADING_CLOSING_BRACE.test(source.slice(match.startIndex + 1))

						// A closing brace lowers its own line: unwound before the level is read
						if (startingClosingBrace && openBracesAtLineEnds > 0) openBracesAtLineEnds -= 1

						expectedIndentLevel += firstLineDiscount + openParenthesesAtLineEnds + openBracesAtLineEnds

						let unwindsParenthesisOpenedAtLineEnd = precedesClosingParenthesis && openParenthesesAtLineEnds > 0

						// From here the counts speak of the next line
						if (unwindsParenthesisOpenedAtLineEnd) openParenthesesAtLineEnds -= 1

						// `once-at-root-twice-in-block`: once at the root, as the default
						let indentsTwice = secondaryOptions.indentInsideParens === `twice` || (secondaryOptions.indentInsideParens === `once-at-root-twice-in-block` && node.parent !== node.root())

						if (indentsTwice) {
							if (!precedesClosingParenthesis || indentClosingBrace) expectedIndentLevel += 1
						}
						else if (unwindsParenthesisOpenedAtLineEnd && !indentClosingBrace) expectedIndentLevel -= 1
					}

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

				if (isDeclaration(node)) {
					let declProp = node.prop
					let declBetween = node.raws.between
					let declValue = syntax.read(node)

					if (!isString(declBetween)) throw new TypeError(`The \`between\` property must be a string`)

					for (let fixPosition of fixPositions) {
						if (fixPosition.startIndex < declProp.length + declBetween.length) {
							node.raws.between = replaceIndentation(
								declBetween,
								fixPosition.currentIndentation,
								fixPosition.expectedIndentation,
								fixPosition.startIndex - declProp.length,
							)
						}
						else {
							declValue = replaceIndentation(
								declValue,
								fixPosition.currentIndentation,
								fixPosition.expectedIndentation,
								fixPosition.startIndex - declProp.length - declBetween.length,
							)

							syntax.write(node, declValue)
						}
					}
				}

				if (isAtRule(node)) writeAtRuleIndentation(node, fixPositions, syntax)
			}
		}
	}
}

/**
 * The levels a node's embedding adds: the host line's indentation, plus one where a template is broken over lines.
 * @param syntax - The syntax asked about the node's embedding.
 * @param node - The node whose host line is measured.
 * @param indentChar - One level's indentation.
 * @returns The host level, and the embedded level.
 */
function embeddingLevel (syntax: Syntax, node: Node, indentChar: string): { hostLevel: number, embeddedLevel: number } {
	let { indent, multiline } = syntax.embedding(node)
	let hostLevel = Math.ceil(indent.length / indentChar.length)

	return { hostLevel, embeddedLevel: hostLevel + (multiline ? 1 : 0) }
}

/** A line to re-indent: its whitespace, the whitespace asked for, and its break's index. */
type FixPosition = {
	expectedIndentation: string,
	currentIndentation: string,
	startIndex: number,
}

/**
 * Writes an at-rule's indentation, each line into its raw.
 *
 * Positions are counted from the at-rule's start through `raws.afterName`, the params and `raws.between`. A line in `raws.between` is one the at-rule swallowed ([#510](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/510)); written onto the end of the params, the file grew a level every run ([#375](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375)).
 * @param atRule - The at-rule.
 * @param fixPositions - The positions, in reverse order.
 * @param syntax - The syntax that reads and writes the params.
 */
function writeAtRuleIndentation (atRule: AtRule, fixPositions: FixPosition[], syntax: Syntax): void {
	let atRuleAfterName = atRule.raws.afterName
	let atRuleParams = syntax.read(atRule)
	let atRuleBetween = atRule.raws.between

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
			// Reached only behind a break the raw holds
			if (!isString(atRuleBetween)) throw new TypeError(`The \`between\` property must be a string`)

			atRuleBetween = replaceIndentation(atRuleBetween, fixPosition.currentIndentation, fixPosition.expectedIndentation, fixPosition.startIndex - paramsEndIndex)
			atRule.raws.between = atRuleBetween
		}
	}
}

/**
 * The base level of a root, cached on its source.
 * @param root - The root whose source caches the level.
 * @param baseIndentLevel - The `baseIndentLevel` option.
 * @param space - The primary option.
 * @param indentClosingBrace - The `indentClosingBrace` option.
 * @returns The base level.
 */
function getRootBaseIndentLevel (root: Root, baseIndentLevel: number | `auto` | undefined, space: number | `tab`, indentClosingBrace: boolean | undefined): number {
	let document = getDocument(root)

	if (!document) return 0

	if (!root.source) throw new Error(`The root node must have a source`)

	let source: Source & { baseIndentLevel?: number } = root.source

	let indentLevel = source.baseIndentLevel

	if (isNumber(indentLevel) && Number.isSafeInteger(indentLevel)) return indentLevel

	let newIndentLevel = inferRootIndentLevel(root, baseIndentLevel, () => inferDocIndentSize(document, space), indentClosingBrace)

	source.baseIndentLevel = newIndentLevel

	return newIndentLevel
}

/**
 * The document a node belongs to.
 * @param node - The node whose root is asked for its document.
 * @returns The document, or undefined.
 */
function getDocument (node: Node): Document | undefined {
	let holder = `document` in node ? node : node.root()

	if (!(`document` in holder)) return

	return holder.document as Document | undefined
}

/**
 * Infers a document's indent size, cached on its source.
 * @param document - The document whose source is measured.
 * @param space - The primary option.
 * @returns The indent size.
 */
function inferDocIndentSize (document: Document, space: number | `tab`): number {
	if (!document.source) throw new Error(`The document node must have a source`)

	let docSource: Source & { indentSize?: number } = document.source

	let indentSize = docSource.indentSize

	if (isNumber(indentSize) && Number.isSafeInteger(indentSize)) return indentSize

	let source = document.source.input.css
	let indents = source.match(EVERY_LINE_SPACE_INDENT)

	let scores: Map<number, number> = (new Map())
	let lastIndentSize = 0
	let lastLeadingSpacesLength = 0

	/**
	 * Votes for an indent size.
	 * @param leadingSpacesLength - The width of one line's leading spaces.
	 */
	function vote (leadingSpacesLength: number): void {
		if (leadingSpacesLength) {
			lastIndentSize = Math.abs(leadingSpacesLength - lastLeadingSpacesLength) || lastIndentSize

			if (lastIndentSize > 1) {
				let score = scores.get(lastIndentSize)

				if (score) scores.set(lastIndentSize, score + 1)
				else scores.set(lastIndentSize, 1)
			}
		}
		else lastIndentSize = 0

		lastLeadingSpacesLength = leadingSpacesLength
	}

	if (indents) {
		for (let leadingSpaces of indents) vote(leadingSpaces.length)

		let bestScore = 0

		for (let [indentSizeDate, score] of scores.entries()) {
			if (score > bestScore) {
				bestScore = score
				indentSize = indentSizeDate
			}
		}
	}

	// With no vote cast, the first indented line's width stands in
	let firstIndentSize = indents?.[0]?.length ?? 0

	indentSize = Number(indentSize) || firstIndentSize || Number(space) || 2
	docSource.indentSize = indentSize

	return indentSize
}

/**
 * Infers a root's base level.
 * @param root - The root whose own lines are read.
 * @param baseIndentLevel - The `baseIndentLevel` option.
 * @param indentSize - Returns the indent size.
 * @param indentClosingBrace - The `indentClosingBrace` option.
 * @returns The level.
 */
function inferRootIndentLevel (root: Root, baseIndentLevel: number | `auto` | undefined, indentSize: () => number, indentClosingBrace: boolean | undefined): number {
	/**
	 * The level of an indentation string.
	 * @param indent - The indentation.
	 * @returns The level.
	 */
	function getIndentLevel (indent: string): number {
		let tabMatch = indent.match(EVERY_TAB)
		let tabCount = tabMatch ? tabMatch.length : 0

		let spaceMatch = indent.match(EVERY_SPACE)
		let spaceCount = spaceMatch ? Math.round(spaceMatch.length / indentSize()) : 0

		return tabCount + spaceCount
	}

	let newBaseIndentLevel

	if (!isNumber(baseIndentLevel) || !Number.isSafeInteger(baseIndentLevel)) {
		let { own, tagLine } = rootLevelIndents(root, indentClosingBrace ?? false)

		// Read off the root's own lines, the ones statements open and blocks close on; a line inside a statement or nested block is measured against this level and rose a level every `--fix` (#594). A brace under `indentClosingBrace` is left out too; the tag's line stands in only where the sheet has no line of its own
		let indents = own.length > 0 ? own : tagLine

		if (indents.length > 0) return Math.min(...indents.map((indent) => getIndentLevel(indent)))

		newBaseIndentLevel = 1
	}
	else newBaseIndentLevel = baseIndentLevel

	let indents = []
	let foundIndents = root.raws.codeBefore?.match(EVERY_LINE_INDENT_WITH_CONTENT)

	// The indent of the first non-empty line in front of the block
	if (foundIndents) {
		let i = foundIndents.length - 1

		while (i >= 0) {
			let foundIndent = foundIndents[i]

			assertString(foundIndent)

			if (OPENS_WITH_TAG.test(foundIndent)) {
				let current = getIndentLevel(foundIndent)

				indents.push(Array.from({ length: current }).fill(`  `).join(``))
				break
			}
			i -= 1
		}
	}

	let after = root.raws.after

	if (after) {
		let afterEnd

		if (TRAILING_LINE_BREAK.test(after)) {
			let document = (`document` in root ? root.document : undefined) as Document | undefined

			if (document) {
				let nextRoot = document.nodes[document.nodes.indexOf(root) + 1]

				afterEnd = nextRoot ? nextRoot.raws.codeBefore : document.raws.codeAfter
			}
			else {
				// Nested root node in css-in-js lang
				let parent = root.parent

				if (!parent) throw new Error(`The root node must have a parent`)

				let nextRoot = parent.nodes[parent.nodes.indexOf(root) + 1]

				afterEnd = nextRoot ? nextRoot.raws.codeBefore : root.raws.codeAfter
			}
		}
		else afterEnd = after

		if (afterEnd) indents.push(afterEnd.match(LEADING_SPACES_AND_TABS)[0])
	}

	if (indents.length > 0) return Math.max(...indents.map((indent) => getIndentLevel(indent))) + newBaseIndentLevel

	return newBaseIndentLevel
}

/**
 * Writes the indentation behind every break of a text.
 * @param str - The text.
 * @param whitespace - The indentation.
 * @returns The text.
 */
function fixIndentation (str: string, whitespace: string): string {
	return str.replaceAll(EVERY_LINE_BREAK_AND_INDENT, `$1${whitespace}`)
}

/**
 * Replaces the indentation behind one break.
 * @param input - The text.
 * @param searchString - The indentation there.
 * @param replaceString - The replacement.
 * @param startIndex - The break's index.
 * @returns The text.
 */
function replaceIndentation (input: string, searchString: string, replaceString: string, startIndex: number): string {
	let offset = startIndex + 1
	let stringStart = input.slice(0, offset)
	let stringEnd = input.slice(offset + searchString.length)

	return stringStart + replaceString + stringEnd
}

// Reads every line a run's writers touch, so it takes the run's last turn (#353)
export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule, defersToRunEnd: true })

export let { ruleName, messages } = createRule(css)
