import { createRule } from "../../../../rules/value-slash-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4/$a; }`,
		},
		{
			description: `a solidus beside a call, which Sass divides at`,
			code: `a { b: fn()/2; }`,
		},
		{
			description: `a solidus beside a call through a module`,
			code: `a { b: 2/math.div(4, 2); }`,
		},
		{
			description: `a parenthesised group, which is Sass's arithmetic`,
			code: `a { b: (4/2); }`,
		},
		{
			description: `a variable's own declaration, which is no declaration to this rule`,
			code: `$a: 4/2;`,
		},
		{
			description: `a solidus inside the text of an inline comment`,
			code: `a { b: 1 / 2; // 1/2\n}`,
		},
	],

	reject: [
		{
			description: `a solidus beside a call Sass hands through as plain CSS, which keeps the separator`,
			code: `a { b: var(--x)/2; }`,
			fixed: `a { b: var(--x) /2; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `an inline comment closed by the break in front of the solidus, the space the option asks for having nowhere to go but the text of the comment`,
			code: `a { b: 1 // c\n/2; }`,
			fixed: `a { b: 1 // c\n/2; }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4 / $a; }`,
		},
	],

	reject: [
		{
			description: `an inline comment closed by the break in front of the solidus, which the fixer has to leave standing`,
			code: `a { b: 1 // c\n /2; }`,
			fixed: `a { b: 1 // c\n /2; }`,
			line: 2,
			column: 2,
			message: messages.rejectedBefore(),
		},
	],
})
