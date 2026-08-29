import { describe, expect, it } from "vitest"

import { findInterpolationSpans, findInterpolationSpanTouching } from "./index.ts"

/**
 * Builds the node a value parse would hand a rule for a run of a text.
 * @param text - The text the value was parsed from.
 * @param run - The run of it the node stands on, taken at its first occurrence.
 * @param type - What the parser calls the node.
 * @returns The node.
 */
function node (text: string, run: string, type: string = `word`): { type: string, value: string, sourceIndex: number, sourceEndIndex: number } {
	let sourceIndex = text.indexOf(run)

	return { type, value: run, sourceIndex, sourceEndIndex: sourceIndex + run.length }
}

describe(`findInterpolationSpans`, () => {
	it(`no interpolation`, () => {
		expect(findInterpolationSpans(`1px 2px`)).toEqual([])
	})

	it(`a Sass interpolation`, () => {
		expect(findInterpolationSpans(`1px#{$a}`)).toEqual([{ start: 3, end: 8 }])
	})

	it(`a Less interpolation`, () => {
		expect(findInterpolationSpans(`1px@{a}`)).toEqual([{ start: 3, end: 7 }])
	})

	it(`a postcss-simple-vars interpolation`, () => {
		expect(findInterpolationSpans(`1px$(a)`)).toEqual([{ start: 3, end: 7 }])
	})

	it(`a pair of bare braces, which spells an interpolation of nothing`, () => {
		expect(findInterpolationSpans(`"{" 1PX "}"`)).toEqual([])
	})

	it(`two interpolations`, () => {
		expect(findInterpolationSpans(`#{$a}1px#{$b}`)).toEqual([{ start: 0, end: 5 }, { start: 8, end: 13 }])
	})

	it(`an interpolation holding whitespace`, () => {
		expect(findInterpolationSpans(`10px#{$a != $b}`)).toEqual([{ start: 4, end: 15 }])
	})

	it(`an interpolation holding nothing`, () => {
		expect(findInterpolationSpans(`1px#{}`)).toEqual([])
	})

	it(`a Sass interpolation broken over two lines`, () => {
		expect(findInterpolationSpans(`1px#{$a\n$b}`)).toEqual([{ start: 3, end: 11 }])
	})

	it(`a Less interpolation broken over two lines, which Less itself does not read`, () => {
		expect(findInterpolationSpans(`1px@{a\nb}`)).toEqual([])
	})

	it(`a postcss-simple-vars interpolation broken over two lines, which nothing reads`, () => {
		expect(findInterpolationSpans(`1px$(a\nb)`)).toEqual([])
	})
})

describe(`findInterpolationSpanTouching`, () => {
	it(`a node in a value holding no interpolation`, () => {
		let text = `1px 2px`

		expect(findInterpolationSpanTouching(node(text, `2px`), findInterpolationSpans(text))).toBeUndefined()
	})

	it(`a node standing wholly in front of an interpolation`, () => {
		let text = `1px #{$a b}`

		expect(findInterpolationSpanTouching(node(text, `1px`), findInterpolationSpans(text))).toBeUndefined()
	})

	it(`a node standing wholly behind an interpolation`, () => {
		let text = `#{$a b} 1px`

		expect(findInterpolationSpanTouching(node(text, `1px`), findInterpolationSpans(text))).toBeUndefined()
	})

	it(`a node standing wholly inside an interpolation`, () => {
		let text = `#{$a 2px}`

		expect(findInterpolationSpanTouching(node(text, `2px}`), findInterpolationSpans(text))).toEqual({ start: 0, end: 9 })
	})

	it(`a node reaching into an interpolation`, () => {
		let text = `10px#{$a != $b}`

		expect(findInterpolationSpanTouching(node(text, `10px#{$a`), findInterpolationSpans(text))).toEqual({ start: 4, end: 15 })
	})

	it(`a node reaching out of an interpolation`, () => {
		let text = `#{$a b}10px`

		expect(findInterpolationSpanTouching(node(text, `b}10px`), findInterpolationSpans(text))).toEqual({ start: 0, end: 7 })
	})

	it(`a node holding a whole interpolation`, () => {
		let text = `1px#{$a}`

		expect(findInterpolationSpanTouching(node(text, `1px#{$a}`), findInterpolationSpans(text))).toEqual({ start: 3, end: 8 })
	})

	it(`a call whose name is all a function node carries of its own, the interpolation standing between its parentheses`, () => {
		let text = `f(#{$a != $b})`

		expect(findInterpolationSpanTouching({ type: `function`, value: `f`, sourceIndex: 0, sourceEndIndex: 14 }, findInterpolationSpans(text))).toEqual({ start: 2, end: 13 })
	})

	it(`a divider, whose opening stands at the whitespace in front of it`, () => {
		let text = `#{$a b} / 1px`

		expect(findInterpolationSpanTouching({ type: `div`, value: `/`, sourceIndex: 7, sourceEndIndex: 10 }, findInterpolationSpans(text))).toBeUndefined()
	})

	it(`a node touching the second of two interpolations`, () => {
		let text = `#{$a b} 1px#{$c d}`

		expect(findInterpolationSpanTouching(node(text, `1px#{$c`), findInterpolationSpans(text))).toEqual({ start: 11, end: 18 })
	})

	it(`a node measured against no spans at all`, () => {
		expect(findInterpolationSpanTouching(node(`10px#{$a b}`, `10px#{$a`), [])).toBeUndefined()
	})
})
