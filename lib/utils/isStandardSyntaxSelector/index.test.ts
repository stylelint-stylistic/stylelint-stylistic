import { describe, expect, it } from "vitest"

import { isStandardSyntaxSelector } from "./index.ts"

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
	it(`SCSS nested properties`, () => {
		expect(isStandardSyntaxSelector(`.a { .b }`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a { &:hover }`)).toBe(false)
	})
	it(`a quoted attribute value reading like a preprocessor construct`, () => {
		expect(isStandardSyntaxSelector(`[title=":extend(x)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="//"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="<%"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="%>"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title=".foo()bar"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title=".mixin()"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="(@a)"]`)).toBe(true)
	})
	it(`a quoted attribute value holding interpolation`, () => {
		expect(isStandardSyntaxSelector(`[title="#{a}"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="@{a}"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="$(a)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title='#{a}']`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="#{"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="a"]#{$b}`)).toBe(false)
		expect(isStandardSyntaxSelector(`#{$a}[title="b"]`)).toBe(false)
		expect(isStandardSyntaxSelector(`a[b=#{c}][d="e"]`)).toBe(false)
	})
	it(`a quoted attribute value spelling a pair of braces, which is interpolation of the template kind`, () => {
		expect(isStandardSyntaxSelector(`[data-config='{a:1}']`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="{{a}}"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="\${a}"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a{{b}}`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a\${b}`)).toBe(false)
	})
	it(`a comment holding interpolation`, () => {
		expect(isStandardSyntaxSelector(`a /* #{$b} */ c`)).toBe(true)
		expect(isStandardSyntaxSelector(`a /* @{b} */ c`)).toBe(true)
		expect(isStandardSyntaxSelector(`a/*x*/#{$b}`)).toBe(false)
	})
	it(`interpolation whose argument quotes a string`, () => {
		expect(isStandardSyntaxSelector(`.a#{"b"}`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a#{'b'}`)).toBe(false)
	})
	it(`two comments standing side by side, which spell no inline comment between them`, () => {
		expect(isStandardSyntaxSelector(`a/*one*//*two*/b`)).toBe(true)
		expect(isStandardSyntaxSelector(`a:not(  b  )/*one*//*two*/c`)).toBe(true)
		expect(isStandardSyntaxSelector(`a/*one*/ /*two*/b`)).toBe(true)
	})
	it(`a comment holding the text of a preprocessor construct`, () => {
		expect(isStandardSyntaxSelector(`a /* // */ b`)).toBe(true)
		expect(isStandardSyntaxSelector(`a /*:extend(.b)*/ c`)).toBe(true)
		expect(isStandardSyntaxSelector(`a /* <% %> */ b`)).toBe(true)
		expect(isStandardSyntaxSelector(`a // c`)).toBe(false)
	})
	it(`an inline comment whose second slash opens what looks like a block comment`, () => {
		expect(isStandardSyntaxSelector(`a//*x*/b`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a//*x*/ .b`)).toBe(false)
		expect(isStandardSyntaxSelector(`a:not(  b  )//*x*/c`)).toBe(false)
		expect(isStandardSyntaxSelector(`a/*x//y*/b`)).toBe(true)
	})
	it(`a selector closing on a parenthesis and carrying no colon, the shape the core still turns away`, () => {
		expect(isStandardSyntaxSelector(`.foo()`)).toBe(false)
		expect(isStandardSyntaxSelector(`.foo(a, b)`)).toBe(false)
		expect(isStandardSyntaxSelector(`a:not(b)`)).toBe(true)
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
