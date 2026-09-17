import { describe, expect, it } from "vitest"

import { maskStrings } from "./index.ts"

// See #739
describe(`maskStrings`, () => {
	it(`a string ending a line behind a parenthesis, masked by no whitespace a pattern would read as a run`, () => {
		expect(maskStrings(`c("x"\n, d) "y" - e`, [])).toBe(`c(???\n, d) ??? - e`)
	})

	it(`no string`, () => {
		expect(maskStrings(`1px, 2px`, [])).toBe(`1px, 2px`)
	})

	it(`a string of each quotation mark is masked with its marks`, () => {
		expect(maskStrings(`"a,b" 'c'`, [])).toBe(`????? ???`)
	})

	it(`a string ending in an escaped backslash closes on its mark`, () => {
		expect(maskStrings(`"a\\\\",b`, [])).toBe(`?????,b`)
	})

	it(`a quotation mark inside a bare address, which opens no string`, () => {
		expect(maskStrings(`url(x'y),'z'`, [])).toBe(`url(x?y),???`)
	})

	it(`a quoted address, whose string is masked`, () => {
		expect(maskStrings(`url("x"),url('y')`, [])).toBe(`url(???),url(???)`)
		expect(maskStrings(`url( "x" ),y`, [])).toBe(`url( ??? ),y`)
	})

	it(`a quotation mark inside a comment, which opens no string and stays with the comment`, () => {
		expect(maskStrings(`/* ' */ ,'a'`, [{ start: 0, end: 7, isInline: false }])).toBe(`/* ' */ ,???`)
		expect(maskStrings(`a // it's\n,'b'`, [{ start: 2, end: 9, isInline: true }])).toBe(`a // it's\n,???`)
	})

	// See 1789637913
	it(`a string inside the parentheses of a bare address the tokenizer reads as code, which is masked whole`, () => {
		expect(maskStrings(`1px, 1/url(a "),b" ), 2px`, [])).toBe(`1px, 1/url(a ????? ), 2px`)
		expect(maskStrings(`1,url(a ') , b' ),c`, [])).toBe(`1,url(a ??????? ),c`)
		expect(maskStrings(`url( a "),b" ),c`, [])).toBe(`url( a ????? ),c`)
	})

	it(`a quotation mark behind a double slash of code, which opens a string`, () => {
		expect(maskStrings(`myurl(//a) "b",c`, [])).toBe(`myurl(//a) ???,c`)
	})
})
