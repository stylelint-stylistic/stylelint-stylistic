import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: `a { padding: 1px; }`,
			description: `an integer`,
		},
		{
			code: `a { padding: 10px; }`,
			description: `an integer ending in a zero`,
		},
		{
			code: `a { padding: 10.01px; }`,
			description: `a fraction ending in a digit other than zero`,
		},
		{
			code: `a { padding: 10px 1px 1.05px 3.00003em; }`,
			description: `four numbers, none of them ending in a zero`,
		},
		{
			code: `a { padding: 0.01px; }`,
			description: `a fraction with a leading zero and no trailing one`,
		},
		{
			code: `a { padding: .01px; }`,
			description: `a fraction with no leading zero and no trailing one`,
		},
		{
			code: `@media (min-width: 100px) {}`,
			description: `an integer inside a media feature`,
		},
		{
			code: `@import "0.10.css";`,
			description: `an import path carrying a number that ends in a zero`,
		},
		{
			code: `@iMpOrT "0.10.css";`,
			description: `the same at-rule written in mixed case`,
		},
		{
			code: `@IMPORT "0.10.css";`,
			description: `the same at-rule written in upper case`,
		},
		{
			code: `@import url(0.10.css);`,
			description: `the same path written inside a url call`,
		},
		{
			code: `a { background: url(data:image/svg+xml;...1.0); }`,
			description: `a data URI carrying a trailing zero, which the rule does not read`,
		},
		{
			code: `a { background: uRl(data:image/svg+xml;...1.0); }`,
			description: `the same call written in mixed case`,
		},
		{
			code: `a { background: URL(data:image/svg+xml;...1.0); }`,
			description: `the same call written in upper case`,
		},
		{
			code: `a { margin: 0.5em /* 1.600em */ 0.7em; }`,
			description: `a trailing zero inside a comment, which the rule does not read`,
		},
		{
			code: `a::before { content: ".90em"; }`,
			description: `a trailing zero inside a string`,
		},
		{
			code: `a { my-string: "1.00"; }`,
			description: `a trailing zero inside a string that is no content value`,
		},
	],

	reject: [
		{
			code: `a { padding: 1.0px; }`,
			fixed: `a { padding: 1px; }`,
			description: `a single trailing zero`,
			message: messages.rejected,
			line: 1,
			column: 16,
		},
		{
			code: `a { padding: 1.000px; }`,
			fixed: `a { padding: 1px; }`,
			description: `three trailing zeros`,
			message: messages.rejected,
			line: 1,
			column: 16,
		},
		{
			code: `a { padding: 10.0px; }`,
			fixed: `a { padding: 10px; }`,
			description: `a trailing zero after a whole part that ends in a zero`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { padding: 10.010px; }`,
			fixed: `a { padding: 10.01px; }`,
			description: `a trailing zero standing after two other decimals`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { padding: 0.010px; }`,
			fixed: `a { padding: 0.01px; }`,
			description: `a trailing zero in a fraction with a leading zero`,
			message: messages.rejected,
			line: 1,
			column: 18,
		},
		{
			code: `a { padding: .010px; }`,
			fixed: `a { padding: .01px; }`,
			description: `a trailing zero in a fraction with no leading zero`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { transform: translate(2px, 0.40px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			description: `a trailing zero in the second argument of a function`,
			message: messages.rejected,
			line: 1,
			column: 34,
		},
		{
			code: `a { transform: translate(2.0px, 0.40px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			description: `a trailing zero in each argument of a function`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 28,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 36,
				},
			],
		},
		{
			code: `a { padding: 10px 1px 10.010px 3.00003em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			description: `a trailing zero in the third of four numbers`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 28,
				},
			],
		},
		{
			code: `a { padding: 10px 1px 10.01px 3.000030em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			description: `a trailing zero in the last of four numbers`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 38,
				},
			],
		},
		{
			code: `a { padding: 10px 1px 10.010px 3.000030em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			description: `trailing zeros in two of the four numbers`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 28,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 39,
				},
			],
		},
		{
			code: `@media (min-width: 100.0px) {}`,
			fixed: `@media (min-width: 100px) {}`,
			description: `a trailing zero inside a media feature`,
			message: messages.rejected,
			line: 1,
			column: 24,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	reject: [
		{
			code: `@foo: 1.50px;`,
			fixed: `@foo: 1.5px;`,
			description: `a Less at-variable keeps the fix written to its params`,
			message: messages.rejected,
			line: 1,
			column: 10,
		},
	],
})
