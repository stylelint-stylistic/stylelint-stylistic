import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `an integer`,
			code: `a { padding: 1px; }`,
		},
		{
			description: `an integer ending in a zero`,
			code: `a { padding: 10px; }`,
		},
		{
			description: `a fraction ending in a digit other than zero`,
			code: `a { padding: 10.01px; }`,
		},
		{
			description: `four numbers, none of them ending in a zero`,
			code: `a { padding: 10px 1px 1.05px 3.00003em; }`,
		},
		{
			description: `a fraction with a leading zero and no trailing one`,
			code: `a { padding: 0.01px; }`,
		},
		{
			description: `a fraction with no leading zero and no trailing one`,
			code: `a { padding: .01px; }`,
		},
		{
			description: `an integer inside a media feature`,
			code: `@media (min-width: 100px) {}`,
		},
		{
			description: `an import path carrying a number that ends in a zero`,
			code: `@import "0.10.css";`,
		},
		{
			description: `the same at-rule written in mixed case`,
			code: `@iMpOrT "0.10.css";`,
		},
		{
			description: `the same at-rule written in upper case`,
			code: `@IMPORT "0.10.css";`,
		},
		{
			description: `the same path written inside a url call`,
			code: `@import url(0.10.css);`,
		},
		{
			description: `a data URI carrying a trailing zero, which the rule does not read`,
			code: `a { background: url(data:image/svg+xml;...1.0); }`,
		},
		{
			description: `the same call written in mixed case`,
			code: `a { background: uRl(data:image/svg+xml;...1.0); }`,
		},
		{
			description: `the same call written in upper case`,
			code: `a { background: URL(data:image/svg+xml;...1.0); }`,
		},
		{
			description: `a trailing zero inside a comment, which the rule does not read`,
			code: `a { margin: 0.5em /* 1.600em */ 0.7em; }`,
		},
		{
			description: `a trailing zero inside a string`,
			code: `a::before { content: ".90em"; }`,
		},
		{
			description: `a trailing zero inside a string that is no content value`,
			code: `a { my-string: "1.00"; }`,
		},
	],

	reject: [
		{
			description: `a single trailing zero`,
			code: `a { padding: 1.0px; }`,
			fixed: `a { padding: 1px; }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			description: `three trailing zeros`,
			code: `a { padding: 1.000px; }`,
			fixed: `a { padding: 1px; }`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			description: `a trailing zero after a whole part that ends in a zero`,
			code: `a { padding: 10.0px; }`,
			fixed: `a { padding: 10px; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a trailing zero standing after two other decimals`,
			code: `a { padding: 10.010px; }`,
			fixed: `a { padding: 10.01px; }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `a trailing zero in a fraction with a leading zero`,
			code: `a { padding: 0.010px; }`,
			fixed: `a { padding: 0.01px; }`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `a trailing zero in a fraction with no leading zero`,
			code: `a { padding: .010px; }`,
			fixed: `a { padding: .01px; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a trailing zero in the second argument of a function`,
			code: `a { transform: translate(2px, 0.40px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			line: 1,
			column: 34,
			message: messages.rejected,
		},
		{
			description: `a trailing zero in each argument of a function`,
			code: `a { transform: translate(2.0px, 0.40px); }`,
			fixed: `a { transform: translate(2px, 0.4px); }`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 36,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a trailing zero in the third of four numbers`,
			code: `a { padding: 10px 1px 10.010px 3.00003em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a trailing zero in the last of four numbers`,
			code: `a { padding: 10px 1px 10.01px 3.000030em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			warnings: [
				{
					line: 1,
					column: 38,
					message: messages.rejected,
				},
			],
		},
		{
			description: `trailing zeros in two of the four numbers`,
			code: `a { padding: 10px 1px 10.010px 3.000030em; }`,
			fixed: `a { padding: 10px 1px 10.01px 3.00003em; }`,
			warnings: [
				{
					line: 1,
					column: 28,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 39,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a trailing zero inside a media feature`,
			code: `@media (min-width: 100.0px) {}`,
			fixed: `@media (min-width: 100px) {}`,
			line: 1,
			column: 24,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a trailing zero standing behind a block comment the value holds`,
			code: `a { b: 1px /* c */ 0.50em; }`,
			fixed: `a { b: 1px /* c */ 0.5em; }`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a trailing zero on either side of a block comment the value holds and one more behind it`,
			code: `a { b: 1.50px /* c */ 2.50em 3.50rem; }`,
			fixed: `a { b: 1.5px /* c */ 2.5em 3.5rem; }`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 33,
					message: messages.rejected,
				},
			],
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a trailing zero in front of a block comment the parameters of a media query hold`,
			code: `@media (min-width: 100.0px /* c */) { a { b: c; } }`,
			fixed: `@media (min-width: 100px /* c */) { a { b: c; } }`,
			line: 1,
			column: 24,
			message: messages.rejected,
		},
	],
})
