import { describe, expect, it } from "vitest"

import { isStandardSyntaxSelector } from "./index.js"

describe(`isStandardSyntaxSelector`, () => {
	it(`type`, () => {
		expect(isStandardSyntaxSelector(`a`)).toBe(true)
	})
	it(`class`, () => {
		expect(isStandardSyntaxSelector(`.a`)).toBe(true)
	})
	it(`attribute`, () => {
		expect(isStandardSyntaxSelector(`[a=a]`)).toBe(true)
	})
	it(`universal`, () => {
		expect(isStandardSyntaxSelector(`*`)).toBe(true)
	})
	it(`pseudo-class`, () => {
		expect(isStandardSyntaxSelector(`a:last-child`)).toBe(true)
	})
	it(`pseudo-class with function`, () => {
		expect(isStandardSyntaxSelector(`a:not(.b)`)).toBe(true)
	})
	it(`pseudo-element`, () => {
		expect(isStandardSyntaxSelector(`a::after`)).toBe(true)
	})
	it(`compound`, () => {
		expect(isStandardSyntaxSelector(`a.b`)).toBe(true)
	})
	it(`complex`, () => {
		expect(isStandardSyntaxSelector(`a > b`)).toBe(true)
	})
	it(`list`, () => {
		expect(isStandardSyntaxSelector(`a, b`)).toBe(true)
	})
	it(`SCSS interpolation (id)`, () => {
		expect(isStandardSyntaxSelector(`#{50% - $n}`)).toBe(false)
	})
	it(`SCSS interpolation (class)`, () => {
		expect(isStandardSyntaxSelector(`.n-#{$n}`)).toBe(false)
	})
	it(`SCSS interpolation (pseudo)`, () => {
		expect(isStandardSyntaxSelector(`:n-#{$n}`)).toBe(false)
	})
	it(`SCSS placeholder`, () => {
		expect(isStandardSyntaxSelector(`%foo`)).toBe(false)
	})
	it(`SCSS nested properties`, () => {
		expect(isStandardSyntaxSelector(`.a { .b }`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a { &:hover }`)).toBe(false)
	})
	it(`Less interpolation`, () => {
		expect(isStandardSyntaxSelector(`.n-@{n}`)).toBe(false)
	})
	it(`Less extend`, () => {
		expect(isStandardSyntaxSelector(`.a:extend(.a)`)).toBe(false)
	})
	it(`Less extend \`all\``, () => {
		expect(isStandardSyntaxSelector(`.a:extend(.a all)`)).toBe(false)
	})
	it(`Less extend inside ruleset`, () => {
		expect(isStandardSyntaxSelector(`a { &:extend(.a all) }`)).toBe(false)
	})
	it(`Less mixin`, () => {
		expect(isStandardSyntaxSelector(`.foo()`)).toBe(false)
	})
	it(`Less mixin with resolved nested selectors`, () => {
		expect(isStandardSyntaxSelector(`.foo().bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo(@a, @b).bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo()#bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo()#bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo() bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo() + bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo() > bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo() ~ bar`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo()[bar]`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo()[bar='baz']`)).toBe(false)
	})
	it(`Less parametric mixin`, () => {
		expect(isStandardSyntaxSelector(`.foo(@a)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo(@a: 5px)`)).toBe(false)
	})
	it(`SCSS or Less comments`, () => {
		expect(isStandardSyntaxSelector(`a\n// comment\nb`)).toBe(false)
		expect(isStandardSyntaxSelector(`a\n//comment\nb`)).toBe(false)
	})
	it(`ERB templates`, () => {
		// E. g. like in https://github.com/stylelint/stylelint/issues/4489
		expect(isStandardSyntaxSelector(`<% COLORS.each do |color| %>\na`)).toBe(false)
		expect(isStandardSyntaxSelector(`<% eng %>\na`)).toBe(false)
	})
})
