import stylelint from "stylelint"
import valueParser from "postcss-value-parser"

import { addNamespace } from "../../utils/addNamespace.js"
import declarationValueIndex from "../../utils/declarationValueIndex.js"
import getDeclarationValue from "../../utils/getDeclarationValue.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl.js"
import setDeclarationValue from "../../utils/setDeclarationValue.js"
import { isBoolean, isNumber } from "../../utils/validateTypes.js"

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

/** @type {import('stylelint').Rule} */
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

		if (!validOptions) { return }

		let gap = secondaryOptions.gap ?? 1
		let alignQuotes = secondaryOptions.alignQuotes ?? false

		let referenceGap = ` `.repeat(gap)

		root.walkDecls(`grid-template-areas`, (declaration) => {
			let declarationValue = getDeclarationValue(declaration)
			let parsedValue = valueParser(declarationValue)
			let isMultilineDeclaration = declarationValue.includes(`\n`)

			let gridRows = parsedValue.nodes.filter((node) => node.type === `string`)

			// To compare with the formatted value to determine if there is an error
			let originalRows = gridRows.map(({ value }) => value).filter(Boolean)
			// The ones to operate with
			let rows = gridRows
				.map(({ value }) => value.trim().replaceAll(/\s+/g, ` `))
				.filter(Boolean)

			let maxCellsCount = 0
			let table = rows.reduce((acc, row) => {
				let cells = row.split(` `)

				maxCellsCount = Math.max(maxCellsCount, cells.length)
				acc.push(row.split(` `))

				return acc
			}, [])

			let maxLengths = new Array(maxCellsCount).fill(``).reduce((acc, part, index) => {
				let parts = table.map((row) => row[index]?.length ?? 0)

				acc.push(Math.max(part.length, ...parts))

				return acc
			}, [])

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
					if (row.length === maxRowLength) { return row }

					let cleanRowValue = row.trimEnd()

					return `${cleanRowValue}${` `.repeat(maxRowLength - cleanRowValue.length)}`
				})
			}

			let isValid = originalRows.every((row, index) => row === formatted[index])

			if (isValid) { return }

			let extraStartLines = declaration.raws.between.match(/[\r\n?|\n]*/g)
				?.reduce((acc, newLineBlock) => acc + newLineBlock.length, 0)

			let extraStartColumns = extraStartLines === 0
				? declarationValueIndex(declaration) + declaration.source.start.column
				: declaration.raws.between.match(/[^\r\n?|\n]+$/)?.[0].length + 1 || 0

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
					let formattedValue = parsedValue.nodes.reduce((acc, node) => {
						if (node.type === `string`) {
							acc.push(`${node.quote}${formatted.shift()}${node.quote}`)

							return acc
						}
						if (node.type === `comment`) {
							acc.push(`/*${node.value}*/`)

							return acc
						}

						acc.push(`${node.before ?? ``}${node.value}${node.after ?? ``}`)

						return acc
					}, []).join(``)

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
