import valueParser from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_LINE_BREAK_RUN, EVERY_WHITESPACE_RUN, LAST_LINE } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { endsInlineCommentOnFormFeed } from "../../utils/endsInlineCommentOnFormFeed/index.js"
import { findInlineCommentSpans, findInlineCommentSpanTouching } from "../../utils/findInlineCommentSpans/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { readsInlineComments } from "../../utils/readsInlineComments/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { isBoolean, isNumber } from "../../utils/validateTypes/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `named-grid-areas-alignment`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
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
 * @param {import('postcss-value-parser').Node} node - The node of the parsed value.
 * @param {import('../../utils/findInlineCommentSpans/index.js').InlineCommentSpan[]} inlineComments - The spans the inline comments of the value occupy in it.
 * @returns {boolean} True where the node is a row of the grid.
 */
function isGridRow (node, inlineComments) {
	return node.type === `string` && !findInlineCommentSpanTouching(node, inlineComments)
}

/**
 * Requires cell tokens (and optionally ending quotes) within `grid-template-areas` to be aligned.
 * @type {import('stylelint').Rule}
 */
function rule (primary, secondaryOptions = {}) {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{ actual: primary },
			{
				actual: secondaryOptions,
				possible: {
					gap: [isNumber, (value) => value > 1],
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
			let declarationValue = getDeclarationValue(declaration)
			let parsedValue = valueParser(declarationValue)
			let isMultilineDeclaration = declarationValue.includes(`\n`)
			let inlineComments = findInlineCommentSpans(declarationValue, endsInlineCommentOnFormFeed(declaration), readsInlineComments(declaration, result))

			let gridRows = parsedValue.nodes.filter((node) => isGridRow(node, inlineComments))

			// To compare with the formatted value to determine if there is an error
			let originalRows = gridRows.map(({ value }) => value).filter(Boolean)
			// The ones to operate with
			let rows = gridRows
				.map(({ value }) => value.trim().replaceAll(EVERY_WHITESPACE_RUN, ` `))
				.filter(Boolean)

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
					.map((cell, index) => isMultilineDeclaration ? cell.padEnd(maxLengths[index], ` `) : cell)
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

			let extraStartLines = declaration.raws.between.match(EVERY_LINE_BREAK_RUN)
				?.reduce((acc, newLineBlock) => acc + newLineBlock.length, 0)

			let extraStartColumns = extraStartLines === 0
				? declarationValueIndex(declaration) + declaration.source.start.column
				: declaration.raws.between.match(LAST_LINE)?.[0].length + 1 || 0

			report({
				message: messages.expected,
				node: declaration,
				start: {
					line: extraStartLines + declaration.source.start.line,
					column: extraStartColumns,
				},
				end: {
					line: declaration.source.end.line,
					column: declaration.source.end.column,
				},
				result,
				ruleName,
				fix () {
					let acc = []
					for (let node of parsedValue.nodes) {
						if (isGridRow(node, inlineComments)) acc.push(`${node.quote}${formatted.shift()}${node.quote}`)
						// Every comment of the value goes back as the file spells it, character for character, and so does every node carrying any of one — a call reaching into a comment, or a string the parser paired across the quotation mark written inside one. Printing such a node instead drops the parentheses and the arguments of a call written there, and rewrites the text of the comment as a row of the grid. Printing a block comment is no safer: the parser closes one opened as `/*/` on the slash of its own opening, so printing it back around its text writes `/**/` where the file spells three characters, and the double slash that fabricates is an end-of-line comment to the next run, which then reads the value differently from this one and moves it again.
						else if (node.type === `comment` || findInlineCommentSpanTouching(node, inlineComments)) acc.push(declarationValue.slice(node.sourceIndex, node.sourceEndIndex))
						else acc.push(`${node.before ?? ``}${node.value}${node.after ?? ``}`)
					}
					let formattedValue = acc.join(``)

					setDeclarationValue(declaration, formattedValue)
				},
			})
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
