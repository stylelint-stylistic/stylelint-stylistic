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
	it(`Less CSS guards`, () => {
		expect(isStandardSyntaxSelector(`.a when (1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when (1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when not (1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a::before when (default())`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when (@mode = huge)`)).toBe(false)
	})
	it(`a Less CSS guard written with no space in front of its condition`, () => {
		expect(isStandardSyntaxSelector(`.a when(1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when(1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when not(1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when(@mode = huge)`)).toBe(false)
	})
	it(`a quote escaped outside a string, which opens none`, () => {
		expect(isStandardSyntaxSelector(String.raw`.x\'y:hover when ('z' = 'w')`)).toBe(false)
		expect(isStandardSyntaxSelector(String.raw`.x\'y:hover when('z' = 'w')`)).toBe(false)
		expect(isStandardSyntaxSelector(String.raw`.x\'y`)).toBe(true)
		expect(isStandardSyntaxSelector(String.raw`[title='a\'b when (c)']`)).toBe(true)
	})
	it(`a selector naming an element \`when\``, () => {
		expect(isStandardSyntaxSelector(`.foo when .bar`)).toBe(true)
		expect(isStandardSyntaxSelector(`when .bar`)).toBe(true)
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
	it(`a Less mixin call whose argument quotes a colon`, () => {
		expect(isStandardSyntaxSelector(`.mixin("a:b")`)).toBe(false)
		expect(isStandardSyntaxSelector(`.mixin('a:b')`)).toBe(false)
		expect(isStandardSyntaxSelector(`a:not(b)`)).toBe(true)
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
		expect(isStandardSyntaxSelector(`a:extend(.b)`)).toBe(false)
	})
	it(`a comment standing where a guard reads whitespace`, () => {
		expect(isStandardSyntaxSelector(`.a:hover/*x*/when (1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a:hover when/**/(1 = 1)`)).toBe(false)
		expect(isStandardSyntaxSelector(`.mixin(/*:*/)`)).toBe(false)
	})
	it(`an inline comment whose second slash opens what looks like a block comment`, () => {
		expect(isStandardSyntaxSelector(`a//*x*/b`)).toBe(false)
		expect(isStandardSyntaxSelector(`.a//*x*/ .b`)).toBe(false)
		expect(isStandardSyntaxSelector(`a:not(  b  )//*x*/c`)).toBe(false)
		expect(isStandardSyntaxSelector(`a/*x//y*/b`)).toBe(true)
	})
	it(`a preprocessor construct standing beside such a value`, () => {
		expect(isStandardSyntaxSelector(`[title="a"]:extend(.b)`)).toBe(false)
		expect(isStandardSyntaxSelector(`[title="a"] .foo(@a)`)).toBe(false)
		expect(isStandardSyntaxSelector(`[title="a"] // c`)).toBe(false)
		expect(isStandardSyntaxSelector(`[title="a"] <% b %>`)).toBe(false)
	})
	it(`a quoted attribute value reading like a guard`, () => {
		expect(isStandardSyntaxSelector(`[title=" when (x)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`a[href$=' when (']`)).toBe(true)
		expect(isStandardSyntaxSelector(`[aria-label='Show when (advanced)']`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title='hide when not (ready)']`)).toBe(true)
		expect(isStandardSyntaxSelector(`[title="a\\" when (b"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a:hover when (@x = "a")`)).toBe(false)
	})
	it(`a quoted attribute value spanning more than one line`, () => {
		expect(isStandardSyntaxSelector(`a[href="x\\\n when (y)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`a[href="x\\\r when (y)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`a[href="x\\\r\n when (y)"]`)).toBe(true)
		expect(isStandardSyntaxSelector(`a[href="x\\\u2028 when (y)"]`)).toBe(true)
	})
	it(`a guard keyword written in another case, which Less reads as no keyword at all`, () => {
		expect(isStandardSyntaxSelector(`.a:hover WHEN (1 = 1)`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a:hover When (1 = 1)`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a:hover WHEN(1 = 1)`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a:hover when NOT (1 = 1)`)).toBe(true)
		expect(isStandardSyntaxSelector(`.a:hover when not (1 = 1)`)).toBe(false)
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
