import { createRule } from "../../../../rules/linebreaks/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`unix`],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a carriage-return line break inside a selector that holds a block comment`,
			code: `a /* c */,\r\nb { c: d; }`,
			fixed: `a /* c */,\nb { c: d; }`,
			line: 1,
			column: 11,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a carriage-return line break closing an end-of-line comment the selector holds, which this syntax keeps in the selector itself rather than in a second copy beside it`,
			code: `a // c\r\n, b { c: d; }`,
			fixed: `a // c\n, b { c: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a carriage-return line break between a Less at-variable and its value, which this syntax parts with a colon it files behind the name`,
			code: `@variable:\r\n1px;`,
			fixed: `@variable:\n1px;`,
			line: 1,
			column: 11,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a carriage-return line break closing an end-of-line comment that stands between a selector and its block`,
			code: `a // c\r\n{ b: d; }`,
			fixed: `a // c\n{ b: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a carriage-return line break closing an end-of-line comment that the bang of a declaration stands inside, which this syntax files in the raw of that bang`,
			code: `a { b: c // x !important\r\n; }`,
			fixed: `a { b: c // x !important\n; }`,
			line: 1,
			column: 25,
			message: messages.expected(`unix`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`windows`],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed inside a value that holds a block comment`,
			code: `a { b: 1px /* c */\n\t2px; }`,
			fixed: `a { b: 1px /* c */\r\n\t2px; }`,
			line: 1,
			column: 19,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed inside the value of a Less at-variable that holds a block comment`,
			code: `@variable: 1px /* c */\n\t2px;`,
			fixed: `@variable: 1px /* c */\r\n\t2px;`,
			line: 1,
			column: 23,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/270
		{
			description: `a bare line feed closing an end-of-line comment a set of at-rule parameters holds, which this syntax keeps in the parameters themselves rather than in a second copy beside them`,
			code: `@media (min-width: 1px), // c\n(min-width: 2px) { a { b: c; } }`,
			fixed: `@media (min-width: 1px), // c\r\n(min-width: 2px) { a { b: c; } }`,
			line: 1,
			column: 30,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a bare line feed closing an end-of-line comment the selector holds, which this syntax keeps in the selector itself rather than in a second copy beside it`,
			code: `a // c\n, b { c: d; }`,
			fixed: `a // c\r\n, b { c: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a bare line feed inside a selector that holds a block comment, which this syntax keeps in a raw like any other`,
			code: `a /* c */,\nb { c: d; }`,
			fixed: `a /* c */,\r\nb { c: d; }`,
			line: 1,
			column: 11,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a bare line feed between a Less at-variable and its value, which this syntax parts with a colon it files behind the name`,
			code: `@variable:\n1px;`,
			fixed: `@variable:\r\n1px;`,
			line: 1,
			column: 11,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a bare line feed closing an end-of-line comment that stands between a selector and its block`,
			code: `a // c\n{ b: d; }`,
			fixed: `a // c\r\n{ b: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/283
		{
			description: `a bare line feed closing an end-of-line comment that the bang of a declaration stands inside, which this syntax files in the raw of that bang`,
			code: `a { b: c // x !important\n; }`,
			fixed: `a { b: c // x !important\r\n; }`,
			line: 1,
			column: 25,
			message: messages.expected(`windows`),
		},
	],
})
