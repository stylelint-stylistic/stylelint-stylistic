import { equal } from "node:assert/strict"
import { describe, it } from "node:test"

import { isStandardSyntaxSelector } from "./index.js"

describe(`isStandardSyntaxSelector`, () => {
	it(`type`, () => {
		equal(isStandardSyntaxSelector(`a`), true)
	})
	it(`class`, () => {
		equal(isStandardSyntaxSelector(`.a`), true)
	})
	it(`attribute`, () => {
		equal(isStandardSyntaxSelector(`[a=a]`), true)
	})
	it(`universal`, () => {
		equal(isStandardSyntaxSelector(`*`), true)
	})
	it(`pseudo-class`, () => {
		equal(isStandardSyntaxSelector(`a:last-child`), true)
	})
	it(`pseudo-class with function`, () => {
		equal(isStandardSyntaxSelector(`a:not(.b)`), true)
	})
	it(`pseudo-element`, () => {
		equal(isStandardSyntaxSelector(`a::after`), true)
	})
	it(`compound`, () => {
		equal(isStandardSyntaxSelector(`a.b`), true)
	})
	it(`complex`, () => {
		equal(isStandardSyntaxSelector(`a > b`), true)
	})
	it(`list`, () => {
		equal(isStandardSyntaxSelector(`a, b`), true)
	})
	it(`SCSS interpolation (id)`, () => {
		equal(isStandardSyntaxSelector(`#{50% - $n}`), false)
	})
	it(`SCSS interpolation (class)`, () => {
		equal(isStandardSyntaxSelector(`.n-#{$n}`), false)
	})
	it(`SCSS interpolation (pseudo)`, () => {
		equal(isStandardSyntaxSelector(`:n-#{$n}`), false)
	})
	it(`SCSS placeholder`, () => {
		equal(isStandardSyntaxSelector(`%foo`), false)
	})
	it(`SCSS nested properties`, () => {
		equal(isStandardSyntaxSelector(`.a { .b }`), false)
		equal(isStandardSyntaxSelector(`.a { &:hover }`), false)
	})
	it(`Less interpolation`, () => {
		equal(isStandardSyntaxSelector(`.n-@{n}`), false)
	})
	it(`Less extend`, () => {
		equal(isStandardSyntaxSelector(`.a:extend(.a)`), false)
	})
	it(`Less extend \`all\``, () => {
		equal(isStandardSyntaxSelector(`.a:extend(.a all)`), false)
	})
	it(`Less extend inside ruleset`, () => {
		equal(isStandardSyntaxSelector(`a { &:extend(.a all) }`), false)
	})
	it(`Less mixin`, () => {
		equal(isStandardSyntaxSelector(`.foo()`), false)
	})
	it(`Less mixin with resolved nested selectors`, () => {
		equal(isStandardSyntaxSelector(`.foo().bar`), false)
		equal(isStandardSyntaxSelector(`.foo(@a, @b).bar`), false)
		equal(isStandardSyntaxSelector(`.foo()#bar`), false)
		equal(isStandardSyntaxSelector(`.foo()#bar`), false)
		equal(isStandardSyntaxSelector(`.foo() bar`), false)
		equal(isStandardSyntaxSelector(`.foo() + bar`), false)
		equal(isStandardSyntaxSelector(`.foo() > bar`), false)
		equal(isStandardSyntaxSelector(`.foo() ~ bar`), false)
		equal(isStandardSyntaxSelector(`.foo()[bar]`), false)
		equal(isStandardSyntaxSelector(`.foo()[bar='baz']`), false)
	})
	it(`Less parametric mixin`, () => {
		equal(isStandardSyntaxSelector(`.foo(@a)`), false)
		equal(isStandardSyntaxSelector(`.foo(@a: 5px)`), false)
	})
	it(`SCSS or Less comments`, () => {
		equal(isStandardSyntaxSelector(`a\n// comment\nb`), false)
		equal(isStandardSyntaxSelector(`a\n//comment\nb`), false)
	})
	it(`ERB templates`, () => {
		// E. g. like in https://github.com/stylelint/stylelint/issues/4489
		equal(isStandardSyntaxSelector(`<% COLORS.each do |color| %>\na`), false)
		equal(isStandardSyntaxSelector(`<% eng %>\na`), false)
	})
})
