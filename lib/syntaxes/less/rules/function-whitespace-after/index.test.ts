import { createRule } from "../../../../rules/function-whitespace-after/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `a parenthesis standing in the text of a comment this syntax does spell is no parenthesis of the value`,
			code: `
				a {
					b: 1px // c(1)x
					2px;
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a calculation closing in front of a unit, whose parentheses group the expression the unit belongs to and open no call`,
			code: `h1 { width: (@a * 2)px; }`,
		},
		{
			description: `the same calculation written with two groups nested inside a third`,
			code: `h1 { max-height: ((@line-height) * (@lines-to-show))em; }`,
		},
		{
			description: `the same calculation standing among the arguments of a call, whose own parenthesis closes the value`,
			code: `a { b: translate((@a * 2)px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the options of an import, standing in parentheses that open no call and abutting the address behind them`,
			code: `@import (reference)"foo.less";`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the same calculation negated, whose hyphen names no call and leaves the parenthesis a group's`,
			code: `h1 { width: -(@a * 2)px; }`,
		},
		{
			description: `the same calculation subtracted from a number, whose hyphen names no call either`,
			code: `h1 { width: 2-(@a)px; }`,
		},
	],

	reject: [
		{
			description: `comments standing between the values, with a call behind them`,
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			line: 5,
			column: 13,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `an unquoted address, whose double slash the scan that finds the calls would read as a comment opening whatever the syntax spells, were the masking not standing over it`,
			code: `a { b: url(http://x/y.png)red; }`,
			fixed: `a { b: url(http://x/y.png) red; }`,
			line: 1,
			column: 27,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252
			description: `the format call of this syntax, whose name is an operator rather than an identifier`,
			code: `a { b: %("%dpx", @a)red; }`,
			fixed: `a { b: %("%dpx", @a) red; }`,
			line: 1,
			column: 21,
			message: messages.expected,
		},
		{
			description: `the same call standing among the arguments of another`,
			code: `a { b: e(%("%dpx", @a)red); }`,
			fixed: `a { b: e(%("%dpx", @a) red); }`,
			line: 1,
			column: 23,
			message: messages.expected,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `the arithmetic of this syntax, whose sum is spelled the way a calculation spells one`,
			code: `a { b: foo(@a) + 2px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `the same arithmetic with the sign opening the number behind it, whose whitespace is the whole of what keeps the two values two`,
			code: `a { b: foo(@a) -2px; }`,
		},
		{
			description: `the same sign with a decimal point behind it`,
			code: `a { b: foo(@a) -.5px; }`,
		},
		{
			description: `the same sign written as a plus, whose whitespace this syntax reads as it reads the whitespace in front of a minus`,
			code: `a { b: foo(@a) +2px; }`,
		},
		{
			description: `the same sign with a block comment standing between it and the call`,
			code: `a { b: foo(@a) /* c */ -2px; }`,
		},
		{
			description: `the same sign with a comment of this syntax standing between it and the call`,
			code: `
				a { b: foo(@a) //c
				-2px; }
			`,
		},
		{
			description: `the same sign standing in the parameters of an import, which this rule reads by the same walk`,
			code: `@import url(example.css) -1px;`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a calculation closing in front of a space and a unit, which are the two values the author wrote and not one`,
			code: `h1 { width: (@a * 2) px; }`,
		},
		{
			description: `the same two values written with two groups nested inside a third`,
			code: `h1 { max-height: ((@line-height) * (@lines-to-show)) em; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the options of an import, standing in parentheses that open no call and spaced from the address behind them`,
			code: `@import (reference) "foo.less";`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the same two values with the calculation negated, whose hyphen names no call`,
			code: `h1 { width: -(@a * 2) px; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a call spaced from the group behind it, whose own parenthesis is read while the group's is not`,
			code: `a { b: translate(1px) (@a * 2)px; }`,
			fixed: `a { b: translate(1px)(@a * 2)px; }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `a call in front of the operator of a product, which this syntax reads whether whitespace stands beside it or not`,
			code: `a { b: foo(@a) * 2px; }`,
			fixed: `a { b: foo(@a)* 2px; }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
	],
})
