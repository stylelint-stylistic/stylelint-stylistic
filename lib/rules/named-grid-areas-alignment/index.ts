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
 * Asks whether a node of a parsed value is a row of the grid, which is a string standing outside every comment of the value.
 *
 * The parse the node comes from is made over a copy of the value with every comment blanked out, so the question is the node's type and nothing more. `postcss-value-parser` has a node for a block comment and none for a comment opened by a double slash, and it closes a block comment opening `/*\/` on the star it opened with (#378), so a quotation mark written in the text of either opens a string to it that runs to the next quotation mark of the value — and from there on every opening quotation mark of the file is a closing one to the parser and the other way round. Passing such a string over as no row, the way this rule did before #504, left the nodes behind it cut at the wrong places all the same: the closing mark of one row and the opening mark of the next came back as a string of their own, touching no comment, and the last mark of the value as a string never closed, and both were written back as rows. In the blanked copy a comment is spaces, a quotation mark inside one opens nothing, and every string the parser hands back is one the file spells: the scan that finds the comments and the parser read a string the same way, from a quotation mark to the next unescaped one of its kind or to the end of the text, so no string of the copy can reach into a comment either.
 * @param node - The node of the parsed value.
 * @returns True where the node is a row of the grid.
 */
function isGridRow (node: Node): node is StringNode {
	return node.type === `string`
}

/**
 * Counts the characters of a text the way the reader of the file sees them, one per code point.
 *
 * `String.prototype.length` counts the UTF-16 code units JavaScript stores the text in, and a character outside the Basic Multilingual Plane is stored as a surrogate pair: two units standing on one column. Measuring a cell that way made a column as wide as the code units of its widest cell rather than as the characters of it, and `padEnd` writes into every cell but that widest one, so the padding fell as readily on a row holding no such character as on the row holding it, and the value came back from the fix misaligned with no warning left to say so (#520). Every code point from U+10000 up is an ident code point to the grammar, which `IDENTIFIER_CODE_POINT` of `lib/regexps.ts` spells as the surrogate range, so a cell may be named with one, and `lightningcss` lays out the grid below and keeps the name. The iterator of a string steps by code point, so a surrogate pair is counted once. A grapheme cluster spelled with several code points, and a character an editor draws two columns wide, are measured by neither reading and are questions of their own.
 * @param text - The text to measure.
 * @returns The number of characters the text is written with.
 */
function countCharacters (text: string): number {
	return [...text].length
}

/**
 * Pads a text with spaces up to a width counted in the characters {@link countCharacters} counts.
 *
 * `padEnd` measures both the text and the target in code units, so it cannot be handed a width counted otherwise. Neither caller can ask for a width the text already passes — a column is as wide as its widest cell, and a row as wide as the widest row — so the clamp is the tolerance `padEnd` carried rather than a case either of them reaches.
 * @param text - The text to pad.
 * @param width - The width to pad it to, in characters.
 * @returns The text, padded where it is narrower than the width and as it stands where it is not.
 */
function padToWidth (text: string, width: number): string {
	return text + ` `.repeat(Math.max(0, width - countCharacters(text)))
}

/** The columns of a table, in the order they stand on a line. */
const COLUMNS: GridColumn[] = [`names`, `row`, `size`, `trailing`]

/**
 * Lays the lines of a grid shorthand out as a table, and says what to write over every run between two tokens of a line (#45).
 *
 * A column is as wide as the widest text standing in it, the tokens of one column on one line joined with a single space, and the columns stand at fixed offsets from the first token of each line: the names at nought, the row a gap behind the names where any line has one, the size a gap behind the rows, the closing names a gap behind the sizes where any line has one. A token is written at its column's offset, padded from what the line has written so far — never in front of a line's first token, which is the indent's side: a row without a name in front of it stands where the indent puts it, and its size and closing names still reach their columns. Two tokens of one column stand a single space apart, so a name spelled `[a   b]` comes out `[a b]`, which is what `no-multiple-whitespaces` would make of it too. The offsets grow with the widths, so what is padded is never less than a gap.
 * @param lines - The lines of the table.
 * @param textOf - The text a token is written as: the row as it comes out padded, every other token as the file spells it.
 * @param gap - How many spaces part two columns.
 * @returns The text to write over each run, by the index the run opens at in the value.
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

/**
 * Requires cell tokens (and optionally ending quotes) within the rows of `grid-template-areas`, and of the `grid-template` and `grid` shorthands, to be aligned.
 *
 * A shorthand puts a row's size and its line names beside each string and the columns behind a solidus, and the rule reads none of that: every string at the top level of the value is a row, and everything that is no row goes back as the file spells it (#45). So the cells of the rows are aligned with each other exactly as they are in the longhand, a size standing behind a row moves with the row's closing quotation mark — which `alignQuotes` lines up — and a line name in front of one, the solidus and the columns keep the place and the whitespace the author gave them.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, which is `true`.
 * @param secondaryOptions - The secondary options: `gap`, `alignQuotes` and `alignColumns`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: true, secondaryOptions: {
	gap?: number,
	alignQuotes?: boolean,
	alignColumns?: boolean,
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
			// The copy is as long as the value and spells it character for character outside the comments, so every position of the parse counts in the value itself, and the fix below slices the value at those positions.
			let parsedValue = valueParser(blankComments(declarationValue, comments))
			// The question is asked of the text the fix will leave rather than of the text it was handed: a break inside a row is one the fix writes over, and a break anywhere else is one it leaves, so asking it of the whole value made the first run pad the cells of a value it was itself taking the last break out of, and the next run took the padding away again (#402). Whether the padding is right for a row spelled across two lines is not a second question: once the fix has run, the row stands on one line.
			let isMultilineDeclaration = spansLinesOutsideRows(declarationValue, parsedValue.nodes)

			let gridRows = parsedValue.nodes.filter(isGridRow)

			// Every row of the grid keeps an entry in each of the lists built below, the ones holding no cell among them, because the fix walks the nodes of the parse and hands each row the entry standing at the head of `formatted`. Dropping a row from the lists while leaving its node in the walk parts the two: every row behind the dropped one is then written one place earlier than it stands, and the last of them is handed nothing at all, which reaches the value as the word `undefined` in quotes. A row with no cells is aligned to nothing, so its entry is the empty text — which is also what trimming its whitespace comes to.

			// The rows to operate with. Whitespace is read the way the tokenizer reads it — a space, a tab, a line feed, a carriage return or a form feed — and the rule cuts a row on that whitespace alone (#401): `trim` and `\s` take every separator Unicode has, the no-break space among them, and read a cell named with one as no cell at all. The grammar of the property names a cell with a run of ident code points, which `IDENTIFIER_CODE_POINT` of `lib/regexps.ts` spells and a no-break space is none of, and reads any other run as a trash token that makes the declaration invalid — while `lightningcss` reads every code point outside ASCII as a character of a name and lays such a grid out. The rule judges no validity either way, and leaves whatever is no whitespace to the tokenizer as it stands.
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

				// What the padding put behind the last cell is spaces, and a `trimEnd` would take a cell named with a no-break space along with them, now that the row is cut so that such a cell survives to this point.
				return alignQuotes ? formattedRow : formattedRow.replace(TRAILING_CSS_WHITESPACE, ``)
			})

			if (alignQuotes && isMultilineDeclaration) {
				formatted = formatted.map((row) => {
					if (countCharacters(row) === maxRowWidth) return row

					let cleanRowValue = row.replace(TRAILING_CSS_WHITESPACE, ``)

					return padToWidth(cleanRowValue, maxRowWidth)
				})
			}

			// The whole value as the fix would leave it, built before anything is reported, since the table's padding is a change to the value as much as a row's is. Every row is handed its entry by its place among the rows, every run between two tokens of a table line is written as the layout says, and every other node goes back as the file spells it, character for character: printing such a node would write it as the parser understood it rather than as the file has it — `var(--x)` as `var`, the whitespace of `f( 1 , 2 )` outside its parentheses, a comment opening `/*/` as `/**/` — while slicing the value at the positions of the parse hands the text back byte for byte, the comments the parse was made without among it.
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
