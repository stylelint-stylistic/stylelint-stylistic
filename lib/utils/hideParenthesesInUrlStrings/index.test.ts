import { describe, expect, it } from "vitest"

import { findCommentSpans } from "../findCommentSpans/index.ts"

import { hideParenthesesInUrlStrings } from "./index.ts"

describe(`hideParenthesesInUrlStrings`, () => {
	it(`a string holding a closing parenthesis behind the whitespace of an address`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" b ) 1px`)).toBe(`url( a "?" b ) 1px`)
	})

	it(`a string of either kind holding two, behind a form feed`, () => {
		expect(hideParenthesesInUrlStrings(`url(\fa ')/)' ) 1px`)).toBe(`url(\fa '?/?' ) 1px`)
	})

	it(`two strings, of which the second holds the parenthesis the parser reads on to once the first is masked`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" ")" .5 ) 1px`)).toBe(`url( a "?" "?" .5 ) 1px`)
	})

	it(`a string holding an escaped mark in front of its parenthesis`, () => {
		expect(hideParenthesesInUrlStrings(`url( a "\\")" b ) 1px`)).toBe(`url( a "\\"?" b ) 1px`)
	})

	// The walk for comments steps over the string and finds the comment behind it
	it(`a comment behind such a string, which the walk for comments finds and the mask leaves to the caller's guards`, () => {
		let text = `url( a ")" /* ) */ b ) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(`url( a "?" /* ) */ b ) 1px`)
	})

	it(`the same comment where the spans handed in do not hold it, which is read here`, () => {
		expect(hideParenthesesInUrlStrings(`url( a ")" /* ) */ b ) 1px`, [])).toBe(`url( a "?" /* ? */ b ) 1px`)
	})

	it(`a comment the caller knows, whose parenthesis is its guards' to answer for`, () => {
		let text = `url( a /* ) */ ")" ) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`a string holding no parenthesis`, () => {
		expect(hideParenthesesInUrlStrings(`url( a "b" c ) 1px`)).toBe(`url( a "b" c ) 1px`)
	})

	it(`a string behind an address with no whitespace, which the tokenizer takes to the first parenthesis as well`, () => {
		expect(hideParenthesesInUrlStrings(`url(a ")" b) 1px`)).toBe(`url(a ")" b) 1px`)
	})

	it(`a string behind a vertical tab, which is no whitespace to the tokenizer`, () => {
		expect(hideParenthesesInUrlStrings(`url(\va ")" b) 1px`)).toBe(`url(\va ")" b) 1px`)
	})

	it(`a name behind a comma, which the tokenizer glues to the word in front of it`, () => {
		expect(hideParenthesesInUrlStrings(`1,url(a ")" b) 1px`)).toBe(`1,url(a "?" b) 1px`)
	})

	it(`a name behind a solidus, which ends a word of the tokenizer's only in front of a star`, () => {
		expect(hideParenthesesInUrlStrings(`1/url(a ")/b" c) 2px`)).toBe(`1/url(a "?/b" c) 2px`)
	})

	it(`a name behind a vertical tab, which is whitespace to the parser and a word to the tokenizer`, () => {
		expect(hideParenthesesInUrlStrings(`1\vurl(a ")" b) 1px`)).toBe(`1\vurl(a "?" b) 1px`)
	})

	it(`the same name behind whitespace the tokenizer reads, which leaves it a word of its own`, () => {
		expect(hideParenthesesInUrlStrings(`1, url(a ")" b) 1px`)).toBe(`1, url(a ")" b) 1px`)
	})

	it(`a name behind a comment, which ends a word of the tokenizer's`, () => {
		let text = `1/*c*/url(a ")" b) 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`a name behind a colon, which both readers end a word on`, () => {
		expect(hideParenthesesInUrlStrings(`1:url(a ")" b) 1px`)).toBe(`1:url(a ")" b) 1px`)
	})

	it(`a name behind an opening parenthesis, likewise`, () => {
		expect(hideParenthesesInUrlStrings(`1(url(a ")" b) 1px`)).toBe(`1(url(a ")" b) 1px`)
	})

	it(`a name behind the closing parenthesis of a call, likewise`, () => {
		expect(hideParenthesesInUrlStrings(`f(1)url(a ")" b) 1px`)).toBe(`f(1)url(a ")" b) 1px`)
	})

	it(`a quoted address, which the parser reads as a string`, () => {
		expect(hideParenthesesInUrlStrings(`url( ")" ) 1px`)).toBe(`url( ")" ) 1px`)
	})

	it(`a call of another name, which the parser reads as code`, () => {
		expect(hideParenthesesInUrlStrings(`URL( a ")" b ) 1px`)).toBe(`URL( a ")" b ) 1px`)
	})

	it(`an escaped mark behind the whitespace, which opens no string`, () => {
		expect(hideParenthesesInUrlStrings(`url( a \\")" b ) 1px`)).toBe(`url( a \\")" b ) 1px`)
	})

	it(`a comment behind the parenthesis the caller has blanked to spaces, which the tokenizer reads as part of a bare address`, () => {
		expect(hideParenthesesInUrlStrings(`url(    a ")" x) 1px`, [{ start: 4, end: 8, isInline: false }])).toBe(`url(    a ")" x) 1px`)
	})

	it(`an address inside an inline comment`, () => {
		let text = `// url( a ")" b )\n1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})

	it(`an address inside a comment`, () => {
		let text = `/* url( a ")" b ) */ 1px`

		expect(hideParenthesesInUrlStrings(text, findCommentSpans(text))).toBe(text)
	})
})
