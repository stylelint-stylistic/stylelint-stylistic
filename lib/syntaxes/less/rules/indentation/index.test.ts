import { createRule } from "../../../../rules/indentation/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `
				@foo: (
						'a'
				);
			`,
			fixed: `
				@foo: (
				 'a'
				);
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 space`),
		},
		{
			description: `a Less at-variable keeps every fix written to its params`,
			code: `
				@foo: (
							'a',
							'b'
				);
			`,
			fixed: `
				@foo: (
				 'a',
				 'b'
				);
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 4,
					message: messages.expected(`1 space`),
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the same query read as Less`,
			code: `
				@media (min-width: 100px
					) { a { color: pink; } }
			`,
			fixed: `
				@media (min-width: 100px
				) { a { color: pink; } }
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-less`,
	// fix: true,

	accept: [
		{
			description: `a Less mixin call whose arguments each stand a level deeper`,
			code:
				`.foo {\n  .mixin(\n    @foo,\n    @bar,\n    @baz\n  );\n}`,
		},
		{
			description: `the same call written with carriage-return line breaks`,
			code:
				`.foo {\r\n  .mixin(\r\n    @foo,\r\n    @bar,\r\n    @baz\r\n  );\r\n}`,
		},
		{
			description: `a Less mixin call taking a block for one of its arguments`,
			code:
				`.foo {\r\n  .mixin(\r\n    {\r\n      @baz\r\n    }\r\n  );\r\n}`,
		},
		{
			description: `the same call with the block opening on the line of the call`,
			code: `.foo {\r\n  .mixin(@foo, {\r\n    @baz\r\n  });\r\n}`,
		},
		{
			description: `a Less mixin call at the root whose first argument is a block`,
			code: `.mixin({\r\n  @foo\r\n}, @bar);`,
		},
	],
})
testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value whose closing line carries the inline comment`,
			code: `
				a {
				  b: translate(
				    1px,
				    2px
				  ) // c
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value continued on the line behind an inline comment`,
			code: `
				a {
				  b: 1px // c
				  2px;
				}
			`,
			fixed: `
				a {
				  b: 1px // c
				    2px;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `the closing parenthesis of a function on the line behind an inline comment`,
			code: `
				a {
				  b: translate(1px, 2px // c
				    );
				}
			`,
			fixed: `
				a {
				  b: translate(1px, 2px // c
				  );
				}
			`,
			line: 3,
			column: 5,
			message: messages.expected(`2 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a function's arguments opening on the line behind an inline comment, whose parenthesis the comment must not hide`,
			code: `
				a {
				  b: translate( // c
				  1px);
				}
			`,
			fixed: `
				a {
				  b: translate( // c
				    1px);
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value carrying two inline comments, every line behind one of them measured`,
			code: `
				a {
				  b: 1px // c
				  2px // c
				  3px;
				}
			`,
			fixed: `
				a {
				  b: 1px // c
				    2px // c
				    3px;
				}
			`,
			warnings: [
				{ line: 3, column: 3, message: messages.expected(`4 spaces`) },
				{ line: 4, column: 3, message: messages.expected(`4 spaces`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a selector line holding nothing but an inline comment`,
			code: `
				x {
				  a,
				// c
				  b { d: e; }
				}
			`,
			fixed: `
				x {
				  a,
				  // c
				  b { d: e; }
				}
			`,
			line: 3,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `an at-rule's parameters continued on the line behind an inline comment`,
			code: `
				@media screen // c
				and (min-width: 100px) {
				  a {
				    b: c;
				  }
				}
			`,
			fixed: `
				@media screen // c
				  and (min-width: 100px) {
				  a {
				    b: c;
				  }
				}
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a line holding nothing but an inline comment inside a set of parameters`,
			code: `
				@media screen,
				// c
				print {
				  a { b: c; }
				}
			`,
			fixed: `
				@media screen,
				  // c
				  print {
				  a { b: c; }
				}
			`,
			warnings: [
				{ line: 2, column: 1, message: messages.expected(`2 spaces`) },
				{ line: 3, column: 1, message: messages.expected(`2 spaces`) },
			],
		},
	],
})
testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-less`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value continued on the line behind an inline comment, measured in tabs`,
			code: `
				a {
					b: 1px // c
					2px;
				}
			`,
			fixed: `
				a {
					b: 1px // c
						2px;
				}
			`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
	],
})
