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

	it(`the question mark a masked double slash leaves behind names no call`, () => {
		expect(findFunctionArgumentSpans(`1px/?(2)`)).toEqual([])
	})

	it(`the same mark standing in front of a hyphen the file spells, which used to make two and open an identifier`, () => {
		expect(findFunctionArgumentSpans(`1px/?-(2)`)).toEqual([])
	})

	it(`a run opening on a digit names no call, being a dimension in front of a parenthesis`, () => {
		expect(findFunctionArgumentSpans(`2px(1)`)).toEqual([])
	})

	it(`a name opening on two hyphens and a digit, which the grammar allows because the hyphens open it by themselves`, () => {
		expect(findFunctionArgumentSpans(`--1(2)`)).toEqual([{ start: 4, end: 5, name: `--1` }])
	})

	it(`a name that is nothing but an escape`, () => {
		expect(findFunctionArgumentSpans(`\\31 23(1)`)).toEqual([{ start: 7, end: 8, name: `\\31 23` }])
	})

	it(`a hexadecimal escape the whitespace behind it closes, whose name reaches past that whitespace`, () => {
		expect(findFunctionArgumentSpans(`\\66 oo(1)`)).toEqual([{ start: 7, end: 8, name: `\\66 oo` }])
	})

	it(`a name written outside ASCII, and one carrying such a character`, () => {
		expect(findFunctionArgumentSpans(`日本and(1)`)).toEqual([{ start: 6, end: 7, name: `日本and` }])
	})

	it(`a name closing on a hyphen, which CSS spells an identifier by`, () => {
		expect(findFunctionArgumentSpans(`foo-(1)`)).toEqual([{ start: 5, end: 6, name: `foo-` }])
	})

	it(`a name spelling one of its characters as an escape, which is read forwards rather than back from the parenthesis`, () => {
		expect(findFunctionArgumentSpans(`fo\\6f(1)`)).toEqual([{ start: 6, end: 7, name: `fo\\6f` }])
	})

	it(`a name written outside ASCII altogether`, () => {
		expect(findFunctionArgumentSpans(`日本(1)`)).toEqual([{ start: 3, end: 4, name: `日本` }])
	})

	it(`a name Less spells with an operator rather than with an identifier`, () => {
		expect(findFunctionArgumentSpans(`%("%dpx", 1)`)).toEqual([{ start: 2, end: 11, name: `%` }])
	})

	it(`the same operator closing a percentage, which is a number in front of a parenthesis and no call`, () => {
		expect(findFunctionArgumentSpans(`50%(1)`)).toEqual([])
	})

	it(`the same percentage with its number spelled as an escape`, () => {
		expect(findFunctionArgumentSpans(`\\31 %(1)`)).toEqual([])
	})

	it(`a backslash a line break stands behind, which escapes nothing and names nothing`, () => {
		expect(findFunctionArgumentSpans(`\\\n(1)`)).toEqual([])
	})

	it(`a hexadecimal escape a Windows pair closes, which is the one break it spells`, () => {
		expect(findFunctionArgumentSpans(`fo\\6f\r\n(1)`)).toEqual([{ start: 8, end: 9, name: `fo\\6f\r\n` }])
	})

	it(`a name written above the basic plane, whose surrogates are code points of an identifier apiece`, () => {
		expect(findFunctionArgumentSpans(`𠀀(1)`)).toEqual([{ start: 3, end: 4, name: `𠀀` }])
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
