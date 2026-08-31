import { createRule } from "../../../../rules/function-whitespace-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a Sass interpolation closing in front of a unit, whose braces open no call`,
			code: `h1 { max-height: #{($line-height) * ($lines-to-show)}em; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a calculation closing in front of a unit, whose parentheses group the expression the unit belongs to and open no call`,
			code: `h1 { width: (1 + 2)px; }`,
		},
		{
			description: `the same calculation written with two groups nested inside a third`,
			code: `h1 { max-height: ((1) * (2))em; }`,
		},
		{
			description: `the same calculation standing among the arguments of a call, whose own parenthesis closes the value`,
			code: `a { b: translate((1 + 2)px); }`,
		},
		{
			description: `a call whose name an interpolation spells, which names nothing that can be looked up, so its parenthesis is read as a group's`,
			code: `a { b: #{$name}(1)px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the same calculation negated, whose hyphen names no call and leaves the parenthesis a group's`,
			code: `h1 { width: -(1 + 2)px; }`,
		},
		{
			description: `the same calculation subtracted from a number, whose hyphen names no call either`,
			code: `h1 { width: 2-(1)px; }`,
		},
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
	],

	reject: [
		{
			description: `comments standing between the values, with a call behind them`,
			code: `
				a { padding:
				  10px
				  /* comment one*/
				  /* comment two*/
				  var(--boo)orange}
			`,
			fixed: `
				a { padding:
				  10px
				  /* comment one*/
				  /* comment two*/
				  var(--boo) orange}
			`,
			line: 5,
			column: 13,
			message: messages.expected,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `the fix reaches the value this syntax prints, and the comments keep their spelling`,
			code: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo)orange}`,
			fixed: `a { padding:\n  10px\n  // comment one\n  // comment two\n  var(--boo) orange}`,
			line: 5,
			column: 13,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/225
			description: `an unquoted address behind which the syntax's own comment still stands: the address hides the parenthesis from neither reading`,
			code: `
				a {
					b: url(http://x/y.png)red // c
					;
				}
			`,
			fixed: `
				a {
					b: url(http://x/y.png) red // c
					;
				}
			`,
			line: 2,
			column: 24,
			message: messages.expected,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/257
			description: `the arithmetic of this syntax, whose sum is spelled the way a calculation spells one`,
			code: `a { b: foo($a) - 2px; }`,
		},
		{
			description: `the same arithmetic with a comment of this syntax standing between the call and the operator, which is a comment only because the file is read as this syntax`,
			code: `a { b: foo($a) //c\n - 2px; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `the same arithmetic with the sign opening the number behind it, which this syntax reads as a list of two values and reads closed up as a subtraction`,
			code: `a { b: foo($a) -2px; }`,
		},
		{
			description: `the same sign with a decimal point behind it`,
			code: `a { b: foo($a) -.5px; }`,
		},
		{
			description: `the same sign written as a plus, which this syntax reads as an operator whatever whitespace stands beside it, and which the one reading both preprocessors are read by leaves alone all the same`,
			code: `a { b: foo($a) +2px; }`,
		},
		{
			description: `the same sign with a block comment standing between it and the call, the whitespace in front of it being what the reading turns on`,
			code: `a { b: foo($a) /* c */ -2px; }`,
		},
		{
			description: `the same sign with a comment of this syntax standing between it and the call`,
			code: `
				a { b: foo($a) //c
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
			code: `h1 { width: (1 + 2) px; }`,
		},
		{
			description: `the same two values written with two groups nested inside a third`,
			code: `h1 { max-height: ((1) * (2)) em; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `the same two values with the calculation negated, whose hyphen names no call`,
			code: `h1 { width: -(1 + 2) px; }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/230
			description: `a call spaced from the group behind it, whose own parenthesis is read while the group's is not`,
			code: `a { b: translate(1px) (1 + 2)px; }`,
			fixed: `a { b: translate(1px)(1 + 2)px; }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `a call in front of the operator of a product, which this syntax reads whether whitespace stands beside it or not`,
			code: `a { b: foo($a) * 2px; }`,
			fixed: `a { b: foo($a)* 2px; }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-html`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/264
			description: `a page holding a block of each syntax, each of which carries its own reading of the sign behind the call: the plain one closes up and the Sass one is left as it is written`,
			code: `
				<style>a { b: url(x) -1px; }</style>
				<style lang="scss">a { b: foo($a) -2px; }</style>
			`,
			fixed: `
				<style>a { b: url(x)-1px; }</style>
				<style lang="scss">a { b: foo($a) -2px; }</style>
			`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
	],
})
