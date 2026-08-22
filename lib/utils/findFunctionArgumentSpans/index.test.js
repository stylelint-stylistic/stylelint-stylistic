import { describe, expect, it } from "vitest"

import { findFunctionArgumentSpans } from "./index.js"

describe(`findFunctionArgumentSpans`, () => {
	it(`no parenthesis`, () => {
		expect(findFunctionArgumentSpans(`screen and print`)).toEqual([])
	})

	it(`a group opening the text`, () => {
		expect(findFunctionArgumentSpans(`(min-width: 1px)`)).toEqual([])
	})

	it(`a group behind a word`, () => {
		expect(findFunctionArgumentSpans(`screen and (color)`)).toEqual([])
	})

	it(`a call`, () => {
		expect(findFunctionArgumentSpans(`url(a:b)`)).toEqual([{ start: 4, end: 7, name: `url` }])
	})

	it(`a call inside a group`, () => {
		expect(findFunctionArgumentSpans(`(min-width: url(a:b))`)).toEqual([{ start: 16, end: 19, name: `url` }])
	})

	it(`a call inside a call`, () => {
		expect(findFunctionArgumentSpans(`f(g(a))`)).toEqual([{ start: 4, end: 5, name: `g` }, { start: 2, end: 6, name: `f` }])
	})

	it(`a group inside a call`, () => {
		expect(findFunctionArgumentSpans(`calc((1px + 2px) * 3)`)).toEqual([{ start: 5, end: 20, name: `calc` }])
	})

	it(`two calls`, () => {
		expect(findFunctionArgumentSpans(`url(a) and url(b)`)).toEqual([{ start: 4, end: 5, name: `url` }, { start: 15, end: 16, name: `url` }])
	})

	it(`a parenthesis inside a string`, () => {
		expect(findFunctionArgumentSpans(`url("a(b") and (c)`)).toEqual([{ start: 4, end: 9, name: `url` }])
	})

	it(`a parenthesis inside a block comment`, () => {
		expect(findFunctionArgumentSpans(`/* url( */ (color)`)).toEqual([])
	})

	it(`a parenthesis inside an inline comment`, () => {
		expect(findFunctionArgumentSpans(`// url(\n(color)`)).toEqual([])
	})

	it(`a call the text never closes`, () => {
		expect(findFunctionArgumentSpans(`url(a:b`)).toEqual([{ start: 4, end: 7, name: `url` }])
	})

	it(`a group the text never closes`, () => {
		expect(findFunctionArgumentSpans(`(min-width: 1px`)).toEqual([])
	})

	it(`a hyphen is a character of a name`, () => {
		expect(findFunctionArgumentSpans(`image-set(a:b)`)).toEqual([{ start: 10, end: 13, name: `image-set` }])
	})

	it(`a name closes on a digit`, () => {
		expect(findFunctionArgumentSpans(`atan2(1,2)`)).toEqual([{ start: 6, end: 9, name: `atan2` }])
	})

	it(`a name closes on an underscore`, () => {
		expect(findFunctionArgumentSpans(`a_(1)`)).toEqual([{ start: 3, end: 4, name: `a_` }])
	})

	it(`a lone hyphen names no call`, () => {
		expect(findFunctionArgumentSpans(`-(@a * 2)`)).toEqual([])
	})

	it(`a hyphen behind a number names no call`, () => {
		expect(findFunctionArgumentSpans(`2-(1)`)).toEqual([])
	})

	it(`a number names no call`, () => {
		expect(findFunctionArgumentSpans(`2(1)`)).toEqual([])
	})

	it(`the hyphen a masked double slash leaves behind names no call`, () => {
		expect(findFunctionArgumentSpans(`1px/-(2)`)).toEqual([])
	})

	it(`a run opening on a digit names no call, being a dimension in front of a parenthesis`, () => {
		expect(findFunctionArgumentSpans(`2px(1)`)).toEqual([])
	})

	it(`a name is read from where the run of name characters begins, whatever stands in front of it`, () => {
		expect(findFunctionArgumentSpans(`日本and(1)`)).toEqual([{ start: 6, end: 7, name: `and` }])
	})

	it(`a name closing on a hyphen is read as no name, though CSS spells an identifier that way`, () => {
		expect(findFunctionArgumentSpans(`foo-(1)`)).toEqual([])
	})

	it(`a name an escape spells is read as no name, the run in front of the parenthesis being the tail of the escape`, () => {
		expect(findFunctionArgumentSpans(`fo\\6f(1)`)).toEqual([])
	})

	it(`a name written outside ASCII is read as no name`, () => {
		expect(findFunctionArgumentSpans(`日本(1)`)).toEqual([])
	})

	it(`a name Less spells with an operator is read as no name`, () => {
		expect(findFunctionArgumentSpans(`%("%dpx", 1)`)).toEqual([])
	})

	it(`an escaped parenthesis closes nothing`, () => {
		expect(findFunctionArgumentSpans(`url(a\\)b,c)`)).toEqual([{ start: 4, end: 10, name: `url` }])
	})

	it(`an interpolation names no call`, () => {
		expect(findFunctionArgumentSpans(`#{$a}(1,2)`)).toEqual([])
	})

	it(`a media feature standing behind an interpolated query`, () => {
		expect(findFunctionArgumentSpans(`#{$q}(min-width: 1px)`)).toEqual([])
	})

	it(`the name a call was made by is read in lower case`, () => {
		expect(findFunctionArgumentSpans(`URL(a:b)`)).toEqual([{ start: 4, end: 7, name: `url` }])
	})

	it(`a word joining two media features names no call, whatever the file spells`, () => {
		expect(findFunctionArgumentSpans(`screen and(min-width:1px)`)).toEqual([{ start: 11, end: 24, name: `and` }])
	})
})
