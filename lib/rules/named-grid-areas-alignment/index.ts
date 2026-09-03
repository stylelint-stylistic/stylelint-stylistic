import valueParser, { type Node, type StringNode } from "postcss-value-parser"
import stylelint from "stylelint"

import { EVERY_CSS_WHITESPACE_RUN, EVERY_LINE_BREAK_RUN, LAST_LINE, LEADING_CSS_WHITESPACE, LINE_BREAK, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
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
			let comments = syntax.commentSpans(declarationValue, declaration, result)
			// The copy is as long as the value and spells it character for character outside the comments, so every position of the parse counts in the value itself, and the fix below slices the value at those positions.
			let parsedValue = valueParser(blankComments(declarationValue, comments))
			// The question is asked of the text the fix will leave rather than of the text it was handed. Every fix this rule makes to a row collapses the whitespace inside it, line breaks included, so a break standing inside a row is a character the fix is about to write over, while every node that is no row goes back byte for byte, wherever it stands and whatever the parse made of it: the whitespace in front of the first row, between two of them or behind the last, a comment, a call, a word carrying an escaped break. Asking it of the whole value made the first run pad the cells of a value it was itself taking the last break out of, and the next run, reading a declaration that no longer spanned lines, took the padding away again (#402). Whether the padding is right for a row spelled across two lines is not a second question: once the fix has run, the row stands on one line. The slice is taken from the value itself and not from the copy the parse was made over, since `blankComments` writes a space over every character of a comment, the line breaks of its text among them — and a comment spanning two lines is a break the fix leaves standing.
			let isMultilineDeclaration = parsedValue.nodes.some((node) => !isGridRow(node) && LINE_BREAK.test(declarationValue.slice(node.sourceIndex, node.sourceEndIndex)))

			let gridRows = parsedValue.nodes.filter(isGridRow)

			// Every row of the grid keeps an entry in each of the lists built below, the ones holding no cell among them, because the fix walks the nodes of the parse and hands each row the entry standing at the head of `formatted`. Dropping a row from the lists while leaving its node in the walk parts the two: every row behind the dropped one is then written one place earlier than it stands, and the last of them is handed nothing at all, which reaches the value as the word `undefined` in quotes. A row with no cells is aligned to nothing, so its entry is the empty text — which is also what trimming its whitespace comes to.

			// To compare with the formatted value to determine if there is an error
			let originalRows = gridRows.map(({ value }) => value)
			// The ones to operate with. Whitespace is read the way the tokenizer reads it — a space, a tab, a line feed, a carriage return or a form feed — and the rule cuts a row on that whitespace alone (#401): `trim` and `\s` take every separator Unicode has, the no-break space among them, and read a cell named with one as no cell at all. The grammar of the property names a cell with a run of ident code points, which `IDENTIFIER_CODE_POINT` of `lib/regexps.ts` spells and a no-break space is none of, and reads any other run as a trash token that makes the declaration invalid — while `lightningcss` reads every code point outside ASCII as a character of a name and lays such a grid out. The rule judges no validity either way, and leaves whatever is no whitespace to the tokenizer as it stands.
			let rows = gridRows.map(({ value }) => value.replace(LEADING_CSS_WHITESPACE, ``).replace(TRAILING_CSS_WHITESPACE, ``).replaceAll(EVERY_CSS_WHITESPACE_RUN, ` `))

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

				// What the padding put behind the last cell is spaces, and a `trimEnd` would take a cell named with a no-break space along with them, now that the row is cut so that such a cell survives to this point.
				return alignQuotes ? formattedRow : formattedRow.replace(TRAILING_CSS_WHITESPACE, ``)
			})

			if (alignQuotes && isMultilineDeclaration) {
				formatted = formatted.map((row) => {
					if (row.length === maxRowLength) return row

					let cleanRowValue = row.replace(TRAILING_CSS_WHITESPACE, ``)

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
						if (isGridRow(node)) acc.push(`${node.quote}${formatted.shift()}${node.quote}`)
						// A row is the only thing this rule writes, so every other node of the value goes back as the file spells it, character for character. Printing such a node instead writes it as the parser understood it rather than as the file has it, and for a call that is two harms at once: a `function` node holds its name in `value` and its arguments in `nodes`, so `var(--x)` comes back as `var`, and it holds the whitespace written inside its parentheses in `before` and `after`, which the printing puts outside them, so `f( 1 , 2 )` comes back as a space, an `f` and another space. A comment fares no better — the parser closes one opened as `/*/` on the star of its own opening, so printing it back around its text writes `/**/` where the file spells three characters, and what the file wrote inside that comment is left standing behind it as code. Slicing the source asks nothing of the node's type, and joining the slices over the nodes of a parse hands the parsed text back byte for byte, which `valueParser.stringify` does not. It is also what puts every comment back: the parse was made over a copy with the comments blanked, so where the file spells one the walk meets whitespace, and slicing the value there hands the comment back.
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
