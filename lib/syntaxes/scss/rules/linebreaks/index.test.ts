import { createRule } from "../../../../rules/linebreaks/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`unix`],

	accept: [
		{
			description: `a line feed closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\n\t2px; }`,
		},
		{
			description: `a line feed closing an end-of-line comment a set of at-rule parameters holds`,
			code: `@media (min-width: 1px), // c\n(min-width: 2px) { a { b: c; } }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a carriage-return line break closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\r\n\t2px; }`,
			fixed: `a { b: 1px // c\n\t2px; }`,
			line: 1,
			column: 16,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/270
		{
			description: `a carriage-return line break closing an end-of-line comment a set of at-rule parameters holds`,
			code: `@media (min-width: 1px), // c\r\n(min-width: 2px) { a { b: c; } }`,
			fixed: `@media (min-width: 1px), // c\n(min-width: 2px) { a { b: c; } }`,
			line: 1,
			column: 30,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a carriage-return line break closing an end-of-line comment the selector holds`,
			code: `a // c\r\n, b { c: d; }`,
			fixed: `a // c\n, b { c: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`unix`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a carriage-return line break inside a selector that holds a block comment, which this syntax keeps in one raw like any other`,
			code: `a /* c */,\r\nb { c: d; }`,
			fixed: `a /* c */,\nb { c: d; }`,
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
			description: `a carriage-return line break closing an end-of-line comment that stands between a property and its value`,
			code: `a { b // c\r\n: d; }`,
			fixed: `a { b // c\n: d; }`,
			line: 1,
			column: 11,
			message: messages.expected(`unix`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`windows`],

	accept: [
		{
			description: `a carriage-return line break closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\r\n\t2px; }`,
		},
		{
			description: `a carriage-return line break closing an end-of-line comment a set of at-rule parameters holds`,
			code: `@media (min-width: 1px), // c\r\n(min-width: 2px) { a { b: c; } }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/235
		{
			description: `a bare line feed closing an end-of-line comment the value holds`,
			code: `a { b: 1px // c\n\t2px; }`,
			fixed: `a { b: 1px // c\r\n\t2px; }`,
			line: 1,
			column: 16,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/270
		{
			description: `a bare line feed closing an end-of-line comment a set of at-rule parameters holds`,
			code: `@media (min-width: 1px), // c\n(min-width: 2px) { a { b: c; } }`,
			fixed: `@media (min-width: 1px), // c\r\n(min-width: 2px) { a { b: c; } }`,
			line: 1,
			column: 30,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a bare line feed closing an end-of-line comment the selector holds`,
			code: `a // c\n, b { c: d; }`,
			fixed: `a // c\r\n, b { c: d; }`,
			line: 1,
			column: 7,
			message: messages.expected(`windows`),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/269
		{
			description: `a bare line feed inside a selector that holds a block comment, which this syntax keeps in one raw like any other`,
			code: `a /* c */,\nb { c: d; }`,
			fixed: `a /* c */,\r\nb { c: d; }`,
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
			description: `a bare line feed closing an end-of-line comment that stands between a property and its value`,
			code: `a { b // c\n: d; }`,
			fixed: `a { b // c\r\n: d; }`,
			line: 1,
			column: 11,
			message: messages.expected(`windows`),
		},
	],
})
