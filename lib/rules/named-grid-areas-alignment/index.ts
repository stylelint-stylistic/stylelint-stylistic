import valueParser, { type Node, type StringNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_CSS_WHITESPACE_RUN, EVERY_LINE_BREAK_RUN, GRID_AREAS_PROPERTY, LAST_LINE, LEADING_CSS_WHITESPACE, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { type GridColumn, type GridTableLine, gridTableLines, spansLinesOutsideRows } from "../../utils/gridTableLines/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { isBoolean, isNumber } from "../../utils/validateTypes/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `named-grid-areas-alignment`

const MESSAGES = defineMessages({
	expected: (property) => `Expected \`${property}\` value to be aligned`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Asks whether a node of the parsed value is a grid row: a string.
 *
 * Comments are blanked first: the value parser has no `//` comment node and closes `/*\/` on its own star ([#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378)), and a quotation mark inside one would open a string ([#504](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504)).
 * @param node - A node of the parsed value.
 * @returns True where the node is a row.
 */
function isGridRow (node: Node): node is StringNode {
	return node.type === `string`
}

/**
 * Counts code points; `padEnd` counts UTF-16 units and misaligned a cell holding a non-BMP one ([#520](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/520)). Grapheme clusters and double-width characters are not handled.
 * @param text - The text to measure.
 * @returns The number of code points.
 */
function countCharacters (text: string): number {
	return [...text].length
}

/**
 * Pads a text with spaces to a width counted by {@link countCharacters}; the clamp mirrors `padEnd`.
 * @param text - The text to pad.
 * @param width - The width in characters.
 * @returns The padded text.
 */
function padToWidth (text: string, width: number): string {
	return text + ` `.repeat(Math.max(0, width - countCharacters(text)))
}

/** The columns of a table, in the order they stand on a line. */
const COLUMNS: GridColumn[] = [`names`, `row`, `size`, `trailing`]

/**
 * Lays the lines of a grid shorthand out as a table and returns the padding for every run between two tokens ([#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)).
 *
 * A column is as wide as its widest text, tokens of one column on a line are one space apart, and each column stands `gap` behind the one before it where any line has it. Nothing is written in front of the first token, the indent's side.
 * @param lines - The shorthand's lines, each with its tokens by column.
 * @param textOf - The text of a token: the row as padded, anything else as spelled.
 * @param gap - The spaces between columns.
 * @returns The padding for each run, by its start index.
 */
function columnPadding (lines: GridTableLine[], textOf: (span: { start: number, end: number }, column: GridColumn) => string, gap: number): Map<number, string> {
	let lineTexts = lines.map((line) => line.tokens.map(({ span, column }) => ({ column, text: textOf(span, column) })))
	let widths: Record<GridColumn, number> = { names: 0, row: 0, size: 0, trailing: 0 }

	for (let tokens of lineTexts) {
		for (let column of COLUMNS) {
			let text = tokens.filter((token) => token.column === column).map((token) => token.text).join(` `)

			widths[column] = Math.max(widths[column], countCharacters(text))
		}
	}

	let rowOffset = widths.names > 0 ? widths.names + gap : 0
	let sizeOffset = rowOffset + widths.row + gap
	let offsets: Record<GridColumn, number> = { names: 0, row: rowOffset, size: sizeOffset, trailing: sizeOffset + (widths.size > 0 ? widths.size + gap : 0) }

	let writes: Map<number, string> = new Map()

	for (let [at, line] of lines.entries()) {
		let tokens = lineTexts[at] ?? []
		let written = tokens[0]?.text ?? ``

		for (let index = 1; index < tokens.length; index += 1) {
			let previous = tokens[index - 1]
			let token = tokens[index]
			let run = line.gaps[index - 1]

			if (!previous || !token || !run) throw new Error(`A line of the table holds a run between every two of its tokens`)

			let padding = previous.column === token.column ? ` ` : ` `.repeat(offsets[token.column] - countCharacters(written))

			writes.set(run.start, padding)
			written += padding + token.text
		}
	}

	return writes
}

/** `true`; the rule has no other setting. */
export type PrimaryOption = true

/** The secondary options. */
export type SecondaryOptions = {

	/** The spaces between the cells of a row; `1` by default. */
	gap?: number,

	/** Whether the closing quotes are aligned; `false` by default. */
	alignQuotes?: boolean,

	/** Whether the line names and the sizes beside the rows are laid out as columns; `false` by default. */
	alignColumns?: boolean,
}

/**
 * Aligns the cells of the rows of `grid-template-areas`, `grid-template` and `grid`.
 *
 * Every top-level string is a row; everything else is kept as spelled ([#45](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/45)).
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
			{ actual: primary },
			{
				actual: secondaryOptions,
				possible: {
					gap: [isNumber, (value): boolean => Number(value) > 1],
					alignQuotes: [isBoolean],
					alignColumns: [isBoolean],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let gap = secondaryOptions.gap ?? 1
		let alignQuotes = secondaryOptions.alignQuotes ?? false
		let alignColumns = secondaryOptions.alignColumns ?? false

		let referenceGap = ` `.repeat(gap)

		root.walkDecls(GRID_AREAS_PROPERTY, (declaration) => {
			let declarationValue = syntax.read(declaration)
			let comments = syntax.commentSpans(declarationValue, declaration, result)
			// Blanked, not stripped, so every parse index is an index of the value.
			let parsedValue = valueParser(blankComments(declarationValue, comments))
			// A break inside a row is written over, so it is not counted (#402).
			let isMultilineDeclaration = spansLinesOutsideRows(declarationValue, parsedValue.nodes)

			let gridRows = parsedValue.nodes.filter(isGridRow)

			// A cell-less row keeps an empty entry, since `formatted` is indexed by row.

			// `trim` and `\s` would take a no-break space out of a cell name (#401).
			let rows = gridRows.map(({ value }) => value.replace(LEADING_CSS_WHITESPACE, ``).replace(TRAILING_CSS_WHITESPACE, ``).replaceAll(EVERY_CSS_WHITESPACE_RUN, ` `))

			let maxCellsCount = 0
			let table = []
			for (let row of rows) {
				let cells = row.split(` `)

				maxCellsCount = Math.max(maxCellsCount, cells.length)
				table.push(row.split(` `))
			}

			let maxCellWidths = []
			for (let index = 0; index < maxCellsCount; index += 1) {
				let parts = table.map((row) => countCharacters(row[index] ?? ``))

				maxCellWidths.push(Math.max(0, ...parts))
			}

			let maxRowWidth = 0
			let formatted = table.map((row) => {
				let formattedRow = row
					.map((cell, index) => isMultilineDeclaration ? padToWidth(cell, maxCellWidths[index] ?? 0) : cell)
					.join(referenceGap)

				maxRowWidth = Math.max(maxRowWidth, countCharacters(formattedRow))

				// Not `trimEnd`, which would take a no-break space out of a cell name.
				return alignQuotes ? formattedRow : formattedRow.replace(TRAILING_CSS_WHITESPACE, ``)
			})

			if (alignQuotes && isMultilineDeclaration) {
				formatted = formatted.map((row) => {
					if (countCharacters(row) === maxRowWidth) return row

					let cleanRowValue = row.replace(TRAILING_CSS_WHITESPACE, ``)

					return padToWidth(cleanRowValue, maxRowWidth)
				})
			}

			// Built before reporting, since the padding is a change too; other nodes are sliced, since printing writes `/*/` as `/**/`.
			let rowTexts: Map<number, string> = new Map(gridRows.map((node, index) => [node.sourceIndex, `${node.quote}${formatted[index] ?? ``}${node.quote}`]))
			let padding = alignColumns ? columnPadding(gridTableLines(declarationValue, parsedValue.nodes), (span, column) => (column === `row` ? rowTexts.get(span.start) : undefined) ?? declarationValue.slice(span.start, span.end), gap) : new Map<number, string>()
			let formattedValue = parsedValue.nodes.map((node) => rowTexts.get(node.sourceIndex) ?? padding.get(node.sourceIndex) ?? declarationValue.slice(node.sourceIndex, node.sourceEndIndex)).join(``)

			if (formattedValue === declarationValue) return

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
				messageArgs: [declaration.prop],
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
					syntax.write(declaration, formattedValue)
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
