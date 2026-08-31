import valueParser, { type Node, type StringNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_LINE_BREAK_RUN, EVERY_WHITESPACE_RUN, LAST_LINE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInlineCommentSpans, findInlineCommentSpanTouching, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { readsInlineComments } from "../../utils/readsInlineComments/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isBoolean, isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `named-grid-areas-alignment`

const MESSAGES = defineMessages({
	expected: () => `Expected \`grid-template-areas\` value to be aligned`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether a node of a parsed value is a row of the grid, which is a string the file spells rather than one carrying any of the text of an inline comment. A double slash opens a comment that runs to the end of its line, and `postcss-value-parser` has a node for a block comment and none of the kind, so what such a comment holds comes back as ordinary strings, words and calls.
 *
 * The question is put to the whole of the node rather than to the position it opens at, because this rule only ever writes: a string reaching into a comment's text is written back by writing that text, and it is no string the file spells either way. A quotation mark inside a comment is what parts the two readings — the scan that finds the comments steps over the comment and the value parser does not, so an apostrophe written there pairs with the next quotation mark of the value and hands the walk a string neither the file nor the comment holds.
 * @param node - The node of the parsed value.
 * @param inlineComments - The spans the inline comments of the value occupy in it.
 * @returns True where the node is a row of the grid.
 */
function isGridRow (node: Node, inlineComments: InlineCommentSpan[]): node is StringNode {
	return node.type === `string` && !findInlineCommentSpanTouching(node, inlineComments)
}

/**
 * Requires cell tokens (and optionally ending quotes) within `grid-template-areas` to be aligned.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, which is `true`.
 * @param secondaryOptions - The secondary options: `gap` and `alignQuotes`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: true, secondaryOptions: {
	gap?: number,
	alignQuotes?: boolean,
} = {}): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{ actual: primary },
			{
				actual: secondaryOptions,
				possible: {
					gap: [isNumber, (value): boolean => Number(value) > 1],
					alignQuotes: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let gap = secondaryOptions.gap ?? 1
		let alignQuotes = secondaryOptions.alignQuotes ?? false

		let referenceGap = ` `.repeat(gap)

		root.walkDecls(`grid-template-areas`, (declaration) => {
			let declarationValue = syntax.read(declaration)
			let parsedValue = valueParser(declarationValue)
			let isMultilineDeclaration = declarationValue.includes(`\n`)
			let inlineComments = findInlineCommentSpans(declarationValue, readsInlineComments(declaration, result))

			let gridRows = parsedValue.nodes.filter((node) => isGridRow(node, inlineComments))

			// Every row of the grid keeps an entry in each of the lists built below, the ones holding no cell among them, because the fix walks the nodes of the parse and hands each row the entry standing at the head of `formatted`. Dropping a row from the lists while leaving its node in the walk parts the two: every row behind the dropped one is then written one place earlier than it stands, and the last of them is handed nothing at all, which reaches the value as the word `undefined` in quotes. A row with no cells is aligned to nothing, so its entry is the empty text — which is also what trimming its whitespace comes to.

			// To compare with the formatted value to determine if there is an error
			let originalRows = gridRows.map(({ value }) => value)
			// The ones to operate with
			let rows = gridRows.map(({ value }) => value.trim().replaceAll(EVERY_WHITESPACE_RUN, ` `))

			let maxCellsCount = 0
			let table = []
			for (let row of rows) {
				let cells = row.split(` `)

				maxCellsCount = Math.max(maxCellsCount, cells.length)
				table.push(row.split(` `))
			}

			let maxLengths = []
			for (let index = 0; index < maxCellsCount; index += 1) {
				let parts = table.map((row) => row[index]?.length ?? 0)

				maxLengths.push(Math.max(0, ...parts))
			}

			let maxRowLength = 0
			let formatted = table.map((row) => {
				let formattedRow = row
					.map((cell, index) => isMultilineDeclaration ? cell.padEnd(maxLengths[index] ?? 0, ` `) : cell)
					.join(referenceGap)

				maxRowLength = Math.max(maxRowLength, formattedRow.length)

				return alignQuotes ? formattedRow : formattedRow.trimEnd()
			})

			if (alignQuotes && isMultilineDeclaration) {
				formatted = formatted.map((row) => {
					if (row.length === maxRowLength) return row

					let cleanRowValue = row.trimEnd()

					return `${cleanRowValue}${` `.repeat(maxRowLength - cleanRowValue.length)}`
				})
			}

			let isValid = originalRows.every((row, index) => row === formatted[index])

			if (isValid) return

			let { between } = declaration.raws
			let { source } = declaration

			if (between === undefined || !source?.start || !source.end) throw new Error(`The declaration must carry its raws and a source`)

			let extraStartLines = (between.match(EVERY_LINE_BREAK_RUN) ?? [])
				.reduce((acc, newLineBlock) => acc + newLineBlock.length, 0)

			let extraStartColumns = extraStartLines === 0
				? declarationValueIndex(declaration) + source.start.column
				: (between.match(LAST_LINE)?.[0].length ?? -1) + 1

			report({
				message: messages.expected,
				node: declaration,
				start: {
					line: extraStartLines + source.start.line,
					column: extraStartColumns,
				},
				end: {
					line: source.end.line,
					column: source.end.column,
				},
				result,
				ruleName,
				fix () {
					let acc = []
					for (let node of parsedValue.nodes) {
						if (isGridRow(node, inlineComments)) acc.push(`${node.quote}${formatted.shift()}${node.quote}`)
						// A row is the only thing this rule writes, so every other node of the value goes back as the file spells it, character for character. Printing such a node instead writes it as the parser understood it rather than as the file has it, and for a call that is two harms at once: a `function` node holds its name in `value` and its arguments in `nodes`, so `var(--x)` comes back as `var`, and it holds the whitespace written inside its parentheses in `before` and `after`, which the printing puts outside them, so `f( 1 , 2 )` comes back as a space, an `f` and another space. A comment fares no better — the parser closes one opened as `/*/` on the star of its own opening, so printing it back around its text writes `/**/` where the file spells three characters, and what the file wrote inside that comment is left standing behind it as code. Slicing the source asks nothing of the node's type, and joining the slices over the nodes of a parse hands the parsed text back byte for byte, which `valueParser.stringify` does not. It is also what keeps the text of an end-of-line comment, which reaches this walk as ordinary nodes: a call the parser closed inside one, or a string it paired across the quotation mark written there, is written by writing that text.
						else acc.push(declarationValue.slice(node.sourceIndex, node.sourceEndIndex))
					}
					let formattedValue = acc.join(``)

					syntax.write(declaration, formattedValue)
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
