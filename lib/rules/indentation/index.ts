import styleSearch from "style-search"
import stylelint from "stylelint"

import { CRLF, EVERY_LINE_BREAK, EVERY_LINE_BREAK_AND_INDENT, EVERY_LINE_INDENT, EVERY_LINE_INDENT_WITH_CONTENT, EVERY_LINE_SPACE_INDENT, EVERY_SPACE, EVERY_TAB, FIRST_LINE, INDENT_AT_END, LEADING_CLOSING_BRACE, LEADING_CLOSING_PARENTHESIS, LEADING_INDENT_AND_CONTENT, LEADING_SPACES_AND_TABS, LINE_BREAK, OPENING_BRACE_AT_END, OPENING_PARENTHESIS_AT_END, OPENS_WITH_TAG, SPACES_AND_TABS_BEFORE_CONTENT, TRAILING_LINE_BREAK, TRAILING_STAR_OR_UNDERSCORE } from "../../regexps.ts"
import { addNamespace } from "../../utils/addNamespace/index.ts"
import { declarationString } from "../../utils/declarationString/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { getRuleSelector } from "../../utils/getRuleSelector/index.ts"
import { hasBlock } from "../../utils/hasBlock/index.ts"
import { isStyledSyntaxDeclaration } from "../../utils/isStyledSyntaxDeclaration/index.ts"
import { isStyledSyntaxNode } from "../../utils/isStyledSyntaxNode/index.ts"
import { nodeString } from "../../utils/nodeString/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { searchCopy } from "../../utils/searchCopy/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { setRuleSelector } from "../../utils/setRuleSelector/index.ts"
import { isAtRule, isDeclaration, isRoot, isRule } from "../../utils/typeGuards/index.ts"
import { assertString, isBoolean, isNumber, isString } from "../../utils/validateTypes/index.ts"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `indentation`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expected: (x) => `Expected indentation of ${x}`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Specifies indentation.
 * @param primary - The primary option: a number of spaces, or `tab`.
 * @param secondaryOptions - The secondary options: `baseIndentLevel`, `except`, `ignore`, `indentInsideParens` and `indentClosingBrace`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule (primary: number | `tab`, secondaryOptions: { baseIndentLevel?: number | `auto`, except?: (`block` | `value` | `param`)[], ignore?: (`value` | `param` | `inside-parens`)[], indentInsideParens?: `twice` | `once-at-root-twice-in-block`, indentClosingBrace?: boolean } = {}): RuleCheck {
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
		 * Returns a human-readable expectation string based on indentation level.
		 * @param level - The indentation level.
		 * @returns The formatted expectation string.
		 */
		function legibleExpectation (level: number): string {
			let count = spaceCount === null ? level : level * spaceCount
			let quantifiedWarningWord = count === 1 ? warningWord : `${warningWord}s`

			return `${count} ${quantifiedWarningWord}`
		}

		// Cycle through all nodes using walk.
		root.walk((node) => {
			if (isRoot(node)) {
				// Ignore nested template literals root in css-in-js lang
				return
			}

			let nodeLevel = indentationLevel(node)
			let styledDeclarationLevel = isStyledSyntaxNode(node) ? getStyledDeclarationLevel(node) : 0

			// Cut out any * and _ hacks from `before`
			let before = (node.raws.before || ``).replace(TRAILING_STAR_OR_UNDERSCORE, ``)
			let after = typeof node.raws.after === `string` ? node.raws.after : ``
			let parent = node.parent

			if (!parent) throw new Error(`A parent node must be present`)

			let expectedOpeningBraceIndentation = indentChar.repeat(nodeLevel)

			// Only inspect the spaces before the node if this is the first node in root or there is a line break in the `before` string. (If there is no line break before a node, there is no "indentation" to check.)
			let isFirstChild = parent.type === `root` && parent.first === node
			// The whitespace is cut into lines, so that one reading answers both questions asked of it: more than one line means a break stands in it, and the last of them is what the node is indented by. Anything in front of that break is not indentation for this node — it is some other kind of separation, checked by some separate rule
			let beforeLines = before.split(EVERY_LINE_BREAK)
			let indentationBefore = beforeLines.at(-1)

			if ((beforeLines.length > 1 || (isFirstChild && (!getDocument(parent) || (parent.raws.codeBefore && TRAILING_LINE_BREAK.test(parent.raws.codeBefore))))) && indentationBefore !== expectedOpeningBraceIndentation) {
				report({
					message: messages.expected,
					messageArgs: [legibleExpectation(nodeLevel - styledDeclarationLevel)],
					node,
					result,
					ruleName,
					fix () {
						if (isFirstChild && isString(node.raws.before)) node.raws.before = node.raws.before.replace(SPACES_AND_TABS_BEFORE_CONTENT, expectedOpeningBraceIndentation)

						node.raws.before = fixIndentation(node.raws.before, expectedOpeningBraceIndentation)
					},
				})
			}

			// Only blocks have the `after` string to check. Only inspect `after` strings that hold a line break; otherwise there's no indentation involved. And check `indentClosingBrace` to see if it should be indented an extra level.
			let closingBraceLevel = indentClosingBrace ? nodeLevel + 1 : nodeLevel
			let expectedClosingBraceIndentation = indentChar.repeat(closingBraceLevel)
			let afterLines = after.split(EVERY_LINE_BREAK)

			if ((isRule(node) || isAtRule(node)) && hasBlock(node) && afterLines.length > 1 && afterLines.at(-1) !== expectedClosingBraceIndentation) {
				let problemIndex = nodeString(node, result).length - 1

				report({
					message: messages.expected,
					messageArgs: [legibleExpectation(closingBraceLevel - styledDeclarationLevel)],
					node,
					index: problemIndex,
					endIndex: problemIndex,
					result,
					ruleName,
					fix () {
						node.raws.after = fixIndentation(node.raws.after, expectedClosingBraceIndentation)
					},
				})
			}

			// If this is a declaration, check the value
			if (isDeclaration(node)) checkValue(node, nodeLevel)

			// If this is a rule, check the selector
			if (isRule(node)) checkSelector(node, nodeLevel)

			// If this is an at rule, check the params
			if (isAtRule(node)) checkAtRuleParams(node, nodeLevel)
		})

		/**
		 * Roughly calculates the indentation level of the line where styled expression starts. Required to format the error text relative to this level, not the beginning of a line.
		 * @param node - The node to calculate level for.
		 * @returns The calculated indentation level.
		 */
		function getStyledDeclarationLevel (node: import("postcss").Node): number {
			let { parent } = node

			if (!parent?.parent?.source || !parent.source?.start) throw new Error(`A styled expression must stand inside a node with a source`)

			// Content of the line where styled expressions starts
			let expressionStartLine = parent.parent.source.input.css.split(`\n`)[parent.source.start.line - 1]
			// Indent characters (spaces/tabs) before the content of the line where the styled expressions starts
			let indentCharacters = expressionStartLine.match(LEADING_SPACES_AND_TABS)?.[0] ?? ``

			return Math.ceil(indentCharacters.length / indentChar.length)
		}

		/**
		 * Calculates the indentation level for a node.
		 * @param node - The node to calculate level for.
		 * @param level - The current level.
		 * @returns The calculated indentation level.
		 */
		function indentationLevel (node: import("postcss").Node, level: number = 0): number {
			if (!node.parent) throw new Error(`A parent node must be present`)

			let calculatedLevel = level

			if (isStyledSyntaxNode(node)) {
				let isMultilineDeclaration = !!node.parent.source && LINE_BREAK.test(node.parent.source.input.css)

				if (isMultilineDeclaration) calculatedLevel += 1

				calculatedLevel += getStyledDeclarationLevel(node)
			}

			if (isRoot(node.parent)) return calculatedLevel + getRootBaseIndentLevel(node.parent, baseIndentLevel, primary)

			// Indentation level equals the ancestor nodes separating this node from root; so recursively run this operation
			calculatedLevel = indentationLevel(node.parent, calculatedLevel + 1)

			// If `secondaryOptions.except` includes "block", blocks are taken down one from their calculated level (all blocks are the same level as their parents)
			if (optionsMatches(secondaryOptions, `except`, `block`) && (isRule(node) || isAtRule(node)) && hasBlock(node)) calculatedLevel -= 1

			return calculatedLevel
		}

		/**
		 * Checks the value of a declaration for proper indentation.
		 * @param decl - The declaration to check.
		 * @param declLevel - The indentation level of the declaration.
		 */
		function checkValue (decl: import("postcss").Declaration, declLevel: number): void {
			if (!LINE_BREAK.test(decl.value)) return

			if (isStyledSyntaxDeclaration(decl) && decl.value.includes(`\${`)) return

			if (optionsMatches(secondaryOptions, `ignore`, `value`)) return

			let declString = declarationString(decl)
			let valueLevel = optionsMatches(secondaryOptions, `except`, `value`) ? declLevel : declLevel + 1

			checkMultilineBit(declString, valueLevel, decl, declLevel)
		}

		/**
		 * Checks a selector for proper indentation.
		 * @param ruleNode - The rule node to check.
		 * @param ruleLevel - The indentation level of the rule.
		 */
		function checkSelector (ruleNode: import("postcss").Rule, ruleLevel: number): void {
			let level = ruleLevel

			// Less mixins have params, and they should be indented extra
			if (`params` in ruleNode && ruleNode.params) level += 1

			// The lines are measured in the copy the file spells, since that is the text the positions of a warning are counted in and the text a fix is written to
			checkMultilineBit(getRuleSelector(ruleNode), level, ruleNode, ruleLevel)
		}

		/**
		 * Checks at-rule parameters for proper indentation.
		 * @param atRule - The at-rule to check.
		 * @param ruleLevel - The indentation level of the rule.
		 */
		function checkAtRuleParams (atRule: import("postcss").AtRule, ruleLevel: number): void {
			if (optionsMatches(secondaryOptions, `ignore`, `param`)) return

			// @nest and SCSS's @at-root rules should be treated like regular rules, not expected to have their params (selectors) indented
			let paramLevel = optionsMatches(secondaryOptions, `except`, `param`) || atRule.name === `nest` || atRule.name === `at-root` ? ruleLevel : ruleLevel + 1

			checkMultilineBit(`@${atRule.name}${atRule.raws.afterName || ``}${getAtRuleParams(atRule)}${atRule.raws.between || ``}`.trim(), paramLevel, atRule, ruleLevel)
		}

		/**
		 * Checks a multiline bit for proper newline indentation.
		 * @param source - The source string to check.
		 * @param newlineIndentLevel - The expected indentation level.
		 * @param node - The node being checked.
		 * @param nodeLevel - The indentation level of that node, which the level above is measured against.
		 */
		function checkMultilineBit (source: string, newlineIndentLevel: number, node: import("postcss").Node, nodeLevel: number): void {
			if (!LINE_BREAK.test(source)) return

			// The search is handed a copy with every comment blanked out of it rather than the text itself, since `style-search` reads the line break that closes an inline comment as part of that comment and never hands the position over — so every line standing behind such a comment went unmeasured, which is #236. The copy is as long as the text and spells it character for character everywhere else, so the positions of the search are the positions of the file, which is the text a warning is counted in and the text a fix is written to.
			//
			// Nothing else below is handed the copy, save the one test whose pattern already spells a block comment out for itself: a reader that stops at a comment stops at both kinds of it today, and handing it the copy would teach it to look past the block kind as well — a reading of its own, which no comment of this issue's kind is needed to see.
			let { searchString } = searchCopy(source, node, result)

			// Data for current node fixing
			let fixPositions: Array<{ expectedIndentation: string, currentIndentation: string, startIndex: number }> = []

			// Every break the search finds is handed over, and the ones standing inside parentheses are turned away in the callback below, so that the arguments of a function, and the non-standard things written in parentheses beside them — a Sass map among them — may be indented however their author likes.
			// Only a bracket opened at the end of a line raises the lines standing behind it, so a bracket opening a line unwinds one only while such a one is open. One opened in the middle of a line raised nothing, and unwinding it took the count a step past the outermost level of the text being measured — at the root, to an indentation of minus one tab, which is no level and nothing a file can be written with. These are counts rather than a stack: a closing bracket is not matched to the one it closes, so where a bracket opened in the middle of a line closes while another opened at a line's end is still open, the count spends the wrong one. The two kinds are counted apart, since a brace closes on the line it lowers and a parenthesis on the line after it.
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			let openParenthesesAtLineEnds = 0
			let openBracesAtLineEnds = 0

			// One level comes off for the whole of the text where the level it is measured at already pays for the brackets its first line opens
			let firstLineDiscount = 0

			let ignoreInsideParens = optionsMatches(secondaryOptions, `ignore`, `inside-parens`)

			// Where the bit is measured one level above its node, the parentheses the first line opens are already paid for. Only the caller knows whether it raised the level: a selector stands at the node's own level, and so do a set of params under `except: ["param"]` or behind `@nest` or `@at-root`, and a value under `except: ["value"]` — for those the discount pays for parentheses nothing counted, and took the level of a line standing inside them one step below the node, a closing parenthesis alone on its line one step below that. A pseudo-class opening its parentheses at the end of a line raises the lines inside them all the same — and only them, the other selectors of the list standing outside.
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/30
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/74
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
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

					// Modifications for parenthetical content
					if (!ignoreInsideParens && match.insideParens) {
						// If the first match in is within parentheses, reduce the parenthesis penalty
						if (matchCount === 1 && firstLineParenthesesArePaidFor) firstLineDiscount = -1

						// A Windows pair is one break and both its characters belong to it, so the line the search has stopped at the end of stops in front of the carriage return rather than between the two
						let lineEndIndex = match.startIndex > 0 && CRLF.test(source.slice(match.startIndex - 1, match.startIndex + 1)) ? match.startIndex - 1 : match.startIndex

						// A comment standing at the end of the line must not hide the parenthesis that opens the block from this test — the pattern spells out the block kind for itself, and the copy answers for the other one
						let followsOpeningParenthesis = OPENING_PARENTHESIS_AT_END.test(searchString.slice(0, lineEndIndex))

						if (followsOpeningParenthesis) openParenthesesAtLineEnds += 1

						let followsOpeningBrace = OPENING_BRACE_AT_END.test(source.slice(0, lineEndIndex))

						if (followsOpeningBrace) openBracesAtLineEnds += 1

						let startingClosingBrace = LEADING_CLOSING_BRACE.test(source.slice(match.startIndex + 1))

						// A brace lowers the line it opens, so this one is unwound before the level is read rather than after
						if (startingClosingBrace && openBracesAtLineEnds > 0) openBracesAtLineEnds -= 1

						expectedIndentLevel += firstLineDiscount + openParenthesesAtLineEnds + openBracesAtLineEnds

						let unwindsParenthesisOpenedAtLineEnd = precedesClosingParenthesis && openParenthesesAtLineEnds > 0

						// Past this point, adjustments to the counts affect next line
						if (unwindsParenthesisOpenedAtLineEnd) openParenthesesAtLineEnds -= 1

						// `once-at-root-twice-in-block` indents twice wherever the node stands in a block, and once at the root, which is what the default does everywhere
						let indentsTwice = secondaryOptions.indentInsideParens === `twice` || (secondaryOptions.indentInsideParens === `once-at-root-twice-in-block` && node.parent !== node.root())

						if (indentsTwice) {
							if (!precedesClosingParenthesis || indentClosingBrace) expectedIndentLevel += 1
						}
						else if (unwindsParenthesisOpenedAtLineEnd && !indentClosingBrace) expectedIndentLevel -= 1
					}

					// From the index behind the newline, the whitespace standing in front of the first character that is not whitespace — line breaks aside — has to equal the expected indentation. The line is measured in the text rather than in the copy handed to the search, since a comment is content of a line as much as anything else is: a line carrying nothing but a comment is all blanks in the copy and would go unmeasured there, whichever of the two kinds it holds.
					let afterNewlineSpaceMatches = LEADING_INDENT_AND_CONTENT.exec(source.slice(match.startIndex + 1))

					if (!afterNewlineSpaceMatches) return

					let afterNewlineSpace = afterNewlineSpaceMatches[1] || ``
					let expectedIndentation = indentChar.repeat(Math.max(expectedIndentLevel, 0))

					if (afterNewlineSpace !== expectedIndentation) {
						let problemIndex = match.startIndex + afterNewlineSpace.length + 1

						report({
							message: messages.expected,
							messageArgs: [legibleExpectation(expectedIndentLevel)],
							node,
							index: problemIndex,
							endIndex: problemIndex,
							result,
							ruleName,
							fix () {
								// Nothing here asks whether the write lands inside an inline comment, the question `writesIntoInlineComment` answers for a fix standing behind a node: every write of this rule stands at the head of a line, right behind the break the search found, and a break is what closes such a comment — so no write of it can land in one.
								// The positions are collected in reverse order, since writing the indentation at the beginning of a string moves every position behind it
								fixPositions.unshift({
									expectedIndentation,
									currentIndentation: afterNewlineSpace,
									startIndex: match.startIndex,
								})
							},
						})
					}
				},
			)

			if (fixPositions.length > 0) {
				if (isRule(node)) {
					let fixedSelector = getRuleSelector(node)

					for (let fixPosition of fixPositions) {
						fixedSelector = replaceIndentation(
							fixedSelector,
							fixPosition.currentIndentation,
							fixPosition.expectedIndentation,
							fixPosition.startIndex,
						)
					}

					setRuleSelector(node, fixedSelector)
				}

				if (isDeclaration(node)) {
					let declProp = node.prop
					let declBetween = node.raws.between
					let declValue = getDeclarationValue(node)

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

							setDeclarationValue(node, declValue)
						}
					}
				}

				if (isAtRule(node)) {
					let atRuleName = node.name
					let atRuleAfterName = node.raws.afterName
					let atRuleParams = getAtRuleParams(node)

					if (!isString(atRuleAfterName)) throw new TypeError(`The \`afterName\` property must be a string`)

					// 1 — it's a @ length
					let paramsStartIndex = 1 + atRuleName.length + atRuleAfterName.length

					// The positions come in reverse order, so a fix never moves one still to be applied, and the text each of them edits is the one the previous fixes have left behind
					for (let fixPosition of fixPositions) {
						if (fixPosition.startIndex < paramsStartIndex) {
							atRuleAfterName = replaceIndentation(
								atRuleAfterName,
								fixPosition.currentIndentation,
								fixPosition.expectedIndentation,
								fixPosition.startIndex - atRuleName.length - 1,
							)

							node.raws.afterName = atRuleAfterName
						}
						else {
							atRuleParams = replaceIndentation(
								atRuleParams,
								fixPosition.currentIndentation,
								fixPosition.expectedIndentation,
								fixPosition.startIndex - paramsStartIndex,
							)

							setAtRuleParams(node, atRuleParams)
						}
					}
				}
			}
		}
	}
}

/**
 * Gets the base indentation level for the root node.
 * @param root - The root node.
 * @param baseIndentLevel - The base indent level option.
 * @param space - The primary option: the number of spaces of one level, or `tab`.
 * @returns The calculated base indentation level.
 */
function getRootBaseIndentLevel (root: import("postcss").Root, baseIndentLevel: number | `auto` | undefined, space: number | `tab`): number {
	let document = getDocument(root)

	if (!document) return 0

	if (!root.source) throw new Error(`The root node must have a source`)

	let source: import("postcss").Source & { baseIndentLevel?: number } = root.source

	let indentLevel = source.baseIndentLevel

	if (isNumber(indentLevel) && Number.isSafeInteger(indentLevel)) return indentLevel

	let newIndentLevel = inferRootIndentLevel(root, baseIndentLevel, () => inferDocIndentSize(document, space))

	source.baseIndentLevel = newIndentLevel

	return newIndentLevel
}

/**
 * Gets the document node from a PostCSS node.
 * @param node - The node to get document from.
 * @returns The document node or undefined.
 */
function getDocument (node: import("postcss").Node): import("postcss").Document | undefined {
	let holder = `document` in node ? node : node.root()

	if (!(`document` in holder)) return

	return (holder.document as import("postcss").Document | undefined)
}

/**
 * Infers the document indent size from the source.
 * @param document - The document node.
 * @param space - The primary option: the number of spaces of one level, or `tab`.
 * @returns The inferred indent size.
 */
function inferDocIndentSize (document: import("postcss").Document, space: number | `tab`): number {
	if (!document.source) throw new Error(`The document node must have a source`)

	let docSource: import("postcss").Source & { indentSize?: number } = document.source

	let indentSize = docSource.indentSize

	if (isNumber(indentSize) && Number.isSafeInteger(indentSize)) return indentSize

	let source = document.source.input.css
	let indents = source.match(EVERY_LINE_SPACE_INDENT)

	let scores: Map<number, number> = (new Map())
	let lastIndentSize = 0
	let lastLeadingSpacesLength = 0

	/**
	 * Records a vote for an indent size based on leading spaces length.
	 *
	 * @param leadingSpacesLength - The length of leading spaces.
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

	// The width of the first indented line stands in where no vote was cast: a document indented once over says its size once
	let firstIndentSize = indents?.[0]?.length ?? 0

	indentSize = Number(indentSize) || firstIndentSize || Number(space) || 2
	docSource.indentSize = indentSize

	return indentSize
}

/**
 * Infers the root indentation level from the source.
 * @param root - The root node.
 * @param baseIndentLevel - The base indent level option.
 * @param indentSize - Function to get the indent size.
 * @returns The inferred root indentation level.
 */
function inferRootIndentLevel (root: import("postcss").Root, baseIndentLevel: number | `auto` | undefined, indentSize: () => number): number {
	/**
	 * Gets the indentation level from a string.
	 *
	 * @param indent - The indentation string.
	 * @returns The calculated indentation level.
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
		if (!root.source) throw new Error(`The root node must have a source`)

		let source = root.source.input.css

		source = source.replace(FIRST_LINE, (firstLine) => {
			let match = root.raws.codeBefore && INDENT_AT_END.exec(root.raws.codeBefore)

			if (match) return match[1] + firstLine

			return ``
		})

		let indentions = source.match(EVERY_LINE_INDENT)

		if (indentions) return Math.min(...indentions.map((indent) => getIndentLevel(indent)))

		newBaseIndentLevel = 1
	}
	else newBaseIndentLevel = baseIndentLevel

	let indents = []
	let foundIndents = root.raws.codeBefore?.match(EVERY_LINE_INDENT_WITH_CONTENT)

	// The indent level of the CSS code block in non-CSS-like files is determined by the indent of first non-empty line before it.
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
			let document = ((`document` in root ? root.document : undefined) as import("postcss").Document | undefined)

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
 * Writes the indentation an option asks for behind every line break of a text, keeping the break the file spells.
 * @param str - The string to fix.
 * @param whitespace - The whitespace to use for indentation.
 * @returns The fixed string.
 */
function fixIndentation (str: string | undefined, whitespace: string): string | undefined {
	if (!isString(str)) return str

	return str.replaceAll(EVERY_LINE_BREAK_AND_INDENT, `$1${whitespace}`)
}

/**
 * Replaces indentation in a string at the specified position.
 * @param input - The input string.
 * @param searchString - The string to search for.
 * @param replaceString - The string to replace with.
 * @param startIndex - The index to start at.
 * @returns The modified string.
 */
function replaceIndentation (input: string, searchString: string, replaceString: string, startIndex: number): string {
	let offset = startIndex + 1
	let stringStart = input.slice(0, offset)
	let stringEnd = input.slice(offset + searchString.length)

	return stringStart + replaceString + stringEnd
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
