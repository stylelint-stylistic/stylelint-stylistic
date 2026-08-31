import { type AtRule, type Comment, type Declaration, parse, type Rule } from "postcss"
import { parse as parseLess } from "postcss-less"
import { describe, expect, it } from "vitest"

import { pick } from "../../../../vitest.helpers.ts"
import { isStandardPreprocessorComment } from "../../../preprocessor/guards/index.ts"

import { isStandardLessAtRule, isStandardLessDeclaration, isStandardLessProperty, isStandardLessRule, isStandardLessSelector, isStandardLessValue } from "./index.ts"

describe(`isStandardLessAtRule`, () => {
	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
	it(`at-rules spelled without a space in front of their options, which Less compiles as at-rules`, () => {
		let spellings = [
			`a { @import(reference) "x"; }`,
			`a { @supports(a: b); }`,
			`a { @layer(l); }`,
			`a { @plugin(args) "p"; }`,
			`a { @whatever(x); }`,
		]

		for (let spelling of spellings) expect(isStandardLessAtRule(pick(lessAtRules(spelling), 0))).toBe(true)
	})

	// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/357
	it(`a call to a detached ruleset spelled with a space in front of its parentheses, which Less reads as an at-rule`, () => {
		let rules = lessAtRules(`@detached-ruleset: { background: red; }; .top { @detached-ruleset (); }`)

		expect(rules.length).toBe(2)
		expect(isStandardLessAtRule(pick(rules, 1))).toBe(true)
	})

	it(`ignore passing rulesets to mixins`, () => {
		let rules = lessAtRules(
			`@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`,
		)

		expect(rules.length).toBe(2)
		expect(isStandardLessAtRule(pick(rules, 0))).toBe(false)
		expect(isStandardLessAtRule(pick(rules, 1))).toBe(false)
	})

	it(`ignore calling of mixins`, () => {
		let rules = lessAtRules(`a { .mixin(); }`)

		expect(rules.length).toBe(1)
		expect(isStandardLessAtRule(pick(rules, 0))).toBe(false)
	})

	it(`ignore variables`, () => {
		let rules = lessAtRules(`@my-variable: 10px; .top { margin-top: @my-variable; }`)

		expect(rules.length).toBe(1)
		expect(isStandardLessAtRule(pick(rules, 0))).toBe(false)
	})
})

describe(`isStandardPreprocessorComment`, () => {
	it(`LESS inline comment`, () => {
		expect(isStandardPreprocessorComment(less(`// foo`))).toBe(false)
	})
})

describe(`isStandardLessProperty`, () => {
	it(`less variable`, () => {
		expect(isStandardLessProperty(`@{Attr}-color`)).toBe(false)
	})

	it(`less append property value with comma`, () => {
		expect(isStandardLessProperty(`transform+`)).toBe(false)
	})

	it(`less append property value with space`, () => {
		expect(isStandardLessProperty(`transform+_`)).toBe(false)
	})
})

describe(`isStandardLessValue`, () => {
	it(`less var`, () => {
		expect(isStandardLessValue(`@less-variable`)).toBe(false)
	})

	it(`negative less var`, () => {
		expect(isStandardLessValue(`-@less-variable`)).toBe(false)
	})
	it(`a less var behind the other operators, which the same strip uncovers`, () => {
		expect(isStandardLessValue(`*@ratio`)).toBe(false)
		expect(isStandardLessValue(`/@ratio`)).toBe(false)
	})

	it(`less interpolation`, () => {
		expect(isStandardLessValue(`@{var}`)).toBe(false)
	})
})

describe(`isStandardLessDeclaration`, () => {
	it(`property with less variable interpolation (only)`, () => {
		expect(isStandardLessDeclaration(lessDecl(`a { @{var}: 10px; }`))).toBe(true)
	})

	it(`property with less variable interpolation (end)`, () => {
		expect(isStandardLessDeclaration(lessDecl(`a { prop@{var}: 10px; }`))).toBe(true)
	})

	it(`property with less variable interpolation (middle)`, () => {
		expect(isStandardLessDeclaration(lessDecl(`a { prop@{var}erty: 10px; }`))).toBe(true)
	})

	it(`less &:extend`, () => {
		expect(isStandardLessDeclaration(lessDecl(`a { &:extend(b) }`))).toBe(false)
		expect(isStandardLessDeclaration(lessDecl(`a { &:extend(.b all) }`))).toBe(false)
		expect(isStandardLessDeclaration(lessDecl(`a { &:EXTEND(.b) }`))).toBe(false)
	})

	it(`a value spelling an extend, which is no extend of the declaration`, () => {
		expect(isStandardLessDeclaration(lessDecl(`a { b: "extend(x)" }`))).toBe(true)
		expect(isStandardLessDeclaration(lessDecl(`a { content: "a:extend(y)" }`))).toBe(true)
		expect(isStandardLessDeclaration(lessDecl(`a { b: extend(x) }`))).toBe(true)
		expect(isStandardLessDeclaration(lessDecl(`a { b: myextend(x) }`))).toBe(true)
	})

	it(`less map`, () => {
		expect(isStandardLessDeclaration(lessDecl(`@map: { key: value; }`))).toBe(false)
	})

	it(`less another map`, () => {
		expect(isStandardLessDeclaration(lessDecl(`#my-map() { key: value; }`))).toBe(false)
	})
})

describe(`isStandardLessRule`, () => {
	it(`less class parametric mixin`, () => {
		expect(isStandardLessRule(lessNode(`.mixin-name(@var) {}`))).toBe(false)
	})

	it(`non-outputting parametric Less class mixin definition`, () => {
		expect(isStandardLessRule(lessNode(`.mixin-name() {}`))).toBe(false)
	})

	it(`non-outputting Less class mixin definition`, () => {
		expect(isStandardLessRule(lessNode(`.mixin-name(@a, @b) {}`))).toBe(false)
	})

	it(`non-outputting parametric Less class mixin definition ending in number`, () => {
		expect(isStandardLessRule(lessNode(`.mixin-name3(@a, @b) {}`))).toBe(false)
	})

	it(`non-outputting Less ID mixin definition`, () => {
		expect(isStandardLessRule(lessNode(`#mixin-name() {}`))).toBe(false)
	})

	it(`less mixin`, () => {
		expect(isStandardLessRule(lessNode(`.box-shadow(@style, @c) when (iscolor(@c)) {}`))).toBe(false)
	})

	it(`less extend`, () => {
		expect(isStandardLessRule(lessNode(`&:extend(.inline) {}`))).toBe(false)
		expect(isStandardLessRule(lessNode(`.a:extend(.b all) {}`))).toBe(false)
	})

	it(`a quoted attribute value spelling a less extend, which \`postcss-less\` marks as one`, () => {
		expect(isStandardLessRule(lessNode(`[title=":extend(x)"] {}`))).toBe(true)
		expect(isStandardLessRule(lessNode(`[data-x="a:extend(y)"] {}`))).toBe(true)
		expect(isStandardLessRule(lessNode(`[title=':extend(x)'] {}`))).toBe(true)
		expect(isStandardLessRule(lessNode(`[title=":extend(x)"]:extend(.b) {}`))).toBe(false)
	})

	it(`a less extend written in another case, which the syntax marks the rule for all the same`, () => {
		expect(isStandardLessRule(lessNode(`.a:EXTEND(.b) {}`))).toBe(false)
		expect(isStandardLessRule(lessNode(`.a:Extend(.b) {}`))).toBe(false)
		expect(isStandardLessRule(lessNode(`[title=":EXTEND(x)"] {}`))).toBe(true)
		expect(isStandardLessRule(node(`.a:EXTEND(.b) {}`))).toBe(true)
	})

	it(`less detached rulesets`, () => {
		expect(isStandardLessRule(lessNode(`@foo: {};`))).toBe(false)
	})

	it(`less guarded namespaces`, () => {
		expect(isStandardLessRule(lessNode(`#namespace when (@mode=huge) {}`))).toBe(false)
	})

	it(`less parametric mixins`, () => {
		expect(isStandardLessRule(lessNode(`.mixin (@variable: 5) {}`))).toBe(false)
	})

	it(`mixin guards`, () => {
		expect(isStandardLessRule(lessNode(`.mixin (@variable) when (@variable = 10px) {}`))).toBe(false)
	})

	it(`css guards`, () => {
		expect(isStandardLessRule(lessNode(`.foo() when (@variable = true) {}`))).toBe(false)
	})

	it(`css guards without spaces`, () => {
		expect(isStandardLessRule(lessNode(`.foo()when(@variable = true) {}`))).toBe(false)
	})

	it(`css guards with multiple spaces`, () => {
		expect(isStandardLessRule(lessNode(`.foo()   when   (@variable = true) {}`))).toBe(false)
	})

	it(`css guards with newlines`, () => {
		expect(isStandardLessRule(lessNode(`.foo()\nwhen\n(@variable = true) {}`))).toBe(false)
	})

	it(`css guards with CRLF`, () => {
		expect(isStandardLessRule(lessNode(`.foo()\r\nwhen\r\n(@variable = true) {}`))).toBe(false)
	})

	it(`css guards with parenthesis`, () => {
		expect(isStandardLessRule(lessNode(`.foo() when (default()) {}`))).toBe(false)
	})

	it(`css guards with not`, () => {
		expect(isStandardLessRule(lessNode(`.foo() when not (@variable = true) {}`))).toBe(false)
	})
})

describe(`isStandardLessSelector`, () => {
	it(`Less interpolation`, () => {
		expect(isStandardLessSelector(`.n-@{n}`)).toBe(false)
	})

	it(`Less extend`, () => {
		expect(isStandardLessSelector(`.a:extend(.a)`)).toBe(false)
		expect(isStandardLessSelector(`a:extend(.b)`)).toBe(false)
	})

	it(`Less extend \`all\``, () => {
		expect(isStandardLessSelector(`.a:extend(.a all)`)).toBe(false)
	})

	it(`Less extend inside ruleset`, () => {
		expect(isStandardLessSelector(`a { &:extend(.a all) }`)).toBe(false)
	})

	it(`Less mixin`, () => {
		expect(isStandardLessSelector(`.foo()`)).toBe(false)
	})

	it(`Less mixin with resolved nested selectors`, () => {
		expect(isStandardLessSelector(`.foo().bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo(@a, @b).bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo()#bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo()#bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo() bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo() + bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo() > bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo() ~ bar`)).toBe(false)
		expect(isStandardLessSelector(`.foo()[bar]`)).toBe(false)
		expect(isStandardLessSelector(`.foo()[bar='baz']`)).toBe(false)
	})

	it(`Less parametric mixin`, () => {
		expect(isStandardLessSelector(`.foo(@a)`)).toBe(false)
		expect(isStandardLessSelector(`.foo(@a: 5px)`)).toBe(false)
	})

	it(`Less CSS guards`, () => {
		expect(isStandardLessSelector(`.a when (1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when (1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when not (1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a::before when (default())`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when (@mode = huge)`)).toBe(false)
	})

	it(`a Less CSS guard written with no space in front of its condition`, () => {
		expect(isStandardLessSelector(`.a when(1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when(1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when not(1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when(@mode = huge)`)).toBe(false)
	})

	it(`a quote escaped outside a string, which opens none`, () => {
		expect(isStandardLessSelector(String.raw`.x\'y:hover when ('z' = 'w')`)).toBe(false)
		expect(isStandardLessSelector(String.raw`.x\'y:hover when('z' = 'w')`)).toBe(false)
		expect(isStandardLessSelector(String.raw`.x\'y`)).toBe(true)
		expect(isStandardLessSelector(String.raw`[title='a\'b when (c)']`)).toBe(true)
	})

	it(`a selector naming an element \`when\``, () => {
		expect(isStandardLessSelector(`.foo when .bar`)).toBe(true)
		expect(isStandardLessSelector(`when .bar`)).toBe(true)
	})

	it(`a Less mixin call whose argument quotes a colon`, () => {
		expect(isStandardLessSelector(`.mixin("a:b")`)).toBe(false)
		expect(isStandardLessSelector(`.mixin('a:b')`)).toBe(false)
		expect(isStandardLessSelector(`a:not(b)`)).toBe(true)
	})

	it(`a comment standing where a guard reads whitespace`, () => {
		expect(isStandardLessSelector(`.a:hover/*x*/when (1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.a:hover when/**/(1 = 1)`)).toBe(false)
		expect(isStandardLessSelector(`.mixin(/*:*/)`)).toBe(false)
	})

	it(`a preprocessor construct standing beside such a value`, () => {
		expect(isStandardLessSelector(`[title="a"]:extend(.b)`)).toBe(false)
		expect(isStandardLessSelector(`[title="a"] .foo(@a)`)).toBe(false)
		expect(isStandardLessSelector(`[title="a"] // c`)).toBe(false)
		expect(isStandardLessSelector(`[title="a"] <% b %>`)).toBe(false)
	})

	it(`a quoted attribute value reading like a guard`, () => {
		expect(isStandardLessSelector(`[title=" when (x)"]`)).toBe(true)
		expect(isStandardLessSelector(`a[href$=' when (']`)).toBe(true)
		expect(isStandardLessSelector(`[aria-label='Show when (advanced)']`)).toBe(true)
		expect(isStandardLessSelector(`[title='hide when not (ready)']`)).toBe(true)
		expect(isStandardLessSelector(`[title="a\\" when (b"]`)).toBe(true)
		expect(isStandardLessSelector(`.a:hover when (@x = "a")`)).toBe(false)
	})

	it(`a quoted attribute value spanning more than one line`, () => {
		expect(isStandardLessSelector(`a[href="x\\\n when (y)"]`)).toBe(true)
		expect(isStandardLessSelector(`a[href="x\\\r when (y)"]`)).toBe(true)
		expect(isStandardLessSelector(`a[href="x\\\r\n when (y)"]`)).toBe(true)
		expect(isStandardLessSelector(`a[href="x\\\u2028 when (y)"]`)).toBe(true)
	})

	it(`a guard keyword written in another case, which Less reads as no keyword at all`, () => {
		expect(isStandardLessSelector(`.a:hover WHEN (1 = 1)`)).toBe(true)
		expect(isStandardLessSelector(`.a:hover When (1 = 1)`)).toBe(true)
		expect(isStandardLessSelector(`.a:hover WHEN(1 = 1)`)).toBe(true)
		expect(isStandardLessSelector(`.a:hover when NOT (1 = 1)`)).toBe(true)
		expect(isStandardLessSelector(`.a:hover when not (1 = 1)`)).toBe(false)
	})
})

/**
 * Reads every at-rule of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @returns The at-rules, in the order the walk meets them.
 */
function lessAtRules (code: string): AtRule[] {
	let rules: AtRule[] = []

	parseLess(code).walkAtRules((rule) => {
		rules.push(rule)
	})

	return rules
}

/**
 * Reads the first node of a stylesheet written in Less, which the cases spell as a comment.
 * @param code - The stylesheet.
 * @returns That comment.
 */
function less (code: string): Comment {
	return parseLess(code).first as Comment
}

/**
 * Reads the first statement of a stylesheet written in Less, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @returns That rule.
 */
function lessNode (code: string): Rule {
	return parseLess(code).first as Rule
}

/**
 * Reads the first statement of a stylesheet, which the cases spell as a rule.
 * @param code - The stylesheet.
 * @returns That rule.
 */
function node (code: string): Rule {
	return parse(code).first as Rule
}

/**
 * Reads the one declaration of a stylesheet written in Less.
 * @param code - The stylesheet.
 * @returns That declaration.
 */
function lessDecl (code: string): Declaration {
	let list: Declaration[] = []

	parseLess(code).walkDecls((d) => {
		list.push(d)
	})

	let [first] = list

	if (first && list.length === 1) return first

	throw new Error(`Expected length 1, but ${list.length}`)
}
