import valueParser from "postcss-value-parser"
import { describe, expect, it } from "vitest"

import { blankComments } from "../blankComments/index.ts"

import { type GridColumn, gridTableLines, spansLinesOutsideRows } from "./index.ts"

/**
 * Reads the table of a value, each token as its text under its column and each gap as its text.
 * @param value - A grid shorthand laid out over lines.
 * @returns One entry per line: the tokens and the gaps.
 */
function tableOf (value: string): { tokens: [GridColumn, string][], gaps: string[] }[] {
	let { nodes } = valueParser(blankComments(value))

	return gridTableLines(value, nodes).map(({ tokens, gaps }) => ({
		tokens: tokens.map(({ span, column }): [GridColumn, string] => [column, value.slice(span.start, span.end)]),
		gaps: gaps.map(({ start, end }) => value.slice(start, end)),
	}))
}

describe(`gridTableLines`, () => {
	it(`reads the four columns of a line and the gaps between its tokens`, () => {
		expect(tableOf(`\n[header-left] "head head" minmax(30px, 1fr) [header-right]\n[] "nav main" 1fr\n/ 120px 1fr`)).toEqual([
			{ tokens: [[`names`, `[header-left]`], [`row`, `"head head"`], [`size`, `minmax(30px, 1fr)`], [`trailing`, `[header-right]`]], gaps: [` `, ` `, ` `] },
			{ tokens: [[`names`, `[]`], [`row`, `"nav main"`], [`size`, `1fr`]], gaps: [` `, ` `] },
		])
	})

	it(`reads a name spelled with a run inside its brackets as two tokens of one column, the run a gap`, () => {
		expect(tableOf(`\n[a   b] "x x" 1fr\n/ 1fr`)).toEqual([{ tokens: [[`names`, `[a`], [`names`, `b]`], [`row`, `"x x"`], [`size`, `1fr`]], gaps: [`   `, ` `, ` `] }])
	})

	it(`reads a line without a size, whose tokens behind the row are names closing it`, () => {
		expect(tableOf(`\n"a a" [x]\n"b b" 1fr [y]`)).toEqual([
			{ tokens: [[`row`, `"a a"`], [`trailing`, `[x]`]], gaps: [` `] },
			{ tokens: [[`row`, `"b b"`], [`size`, `1fr`], [`trailing`, `[y]`]], gaps: [` `, ` `] },
		])
	})

	it(`ends the tokens of a line at a solidus and at a comment, and leaves the runs beside either to their own rules`, () => {
		expect(tableOf(`\n"a a" 1fr  / 1fr\n"b b"  2fr /* c */ [x]`)).toEqual([
			{ tokens: [[`row`, `"a a"`], [`size`, `1fr`]], gaps: [` `] },
			{ tokens: [[`row`, `"b b"`], [`size`, `2fr`]], gaps: [`  `] },
		])
	})

	it(`reads no line that holds two rows or none, or a comment in front of its row`, () => {
		expect(tableOf(`\n"a a" "b b" 1fr\n[x]\n/* c */ "d d" 1fr\n"e e" 1fr`)).toEqual([{ tokens: [[`row`, `"e e"`], [`size`, `1fr`]], gaps: [` `] }])
	})

	it(`reads the line a row opens on beside the property, and no table at all where the value spans no line outside its rows`, () => {
		expect(tableOf(`"a a" 1fr\n"b b" 2fr`)).toHaveLength(2)
		expect(tableOf(`"a a" 1fr "b b" 2fr / 1fr`)).toEqual([])
		expect(tableOf(`[a]  "x x" 1fr / 1fr`)).toEqual([])
		expect(tableOf(`"a\na" 1fr "b b" 2fr`)).toEqual([])
		expect(spansLinesOutsideRows(`"a\na"`, valueParser(`"a\na"`).nodes)).toBe(false)
	})
})
