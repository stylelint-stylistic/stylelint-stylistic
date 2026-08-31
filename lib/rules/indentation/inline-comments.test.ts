import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value whose line behind an inline comment already stands at its level`,
			code: `
				a {
				  b: 1px // c
				    2px;
				}
			`,
		},
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a block comment behind the brace that opens an interpolation, which the brace must not be read past`,
			code: `
				@a {
				  b: map(
				    c: #{ /* x */
				    d}
				  );
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a block comment in front of the brace that closes an interpolation, which the brace must not be read past`,
			code: `
				@a {
				  b: map(
				    c: #{
				      d
				      /* x */}
				    );
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a line holding nothing but an inline comment inside a value`,
			code: `
				a {
				  b: 1px
				  // c
				    2px;
				}
			`,
			fixed: `
				a {
				  b: 1px
				    // c
				    2px;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a block comment standing in front of the closing parenthesis of a value, which the parenthesis of the line behind it is not read from`,
			code: `
				a {
				  b: translate(
				    1px
				    /* c */);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value continued behind an address, whose double slashes open no comment`,
			code: `
				a {
				  background: url(http://x/y.png)
				  no-repeat;
				}
			`,
			fixed: `
				a {
				  background: url(http://x/y.png)
				    no-repeat;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a selector continued behind a pair of slashes plain CSS spells no comment with`,
			code: `
				a:not( //x
				  b) { c: d; }
			`,
			fixed: `
				a:not( //x
				b) { c: d; }
			`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/236
			description: `a value continued behind a pair of slashes plain CSS spells no comment with`,
			code: `
				a {
				  b: 1px//c
				  2px;
				}
			`,
			fixed: `
				a {
				  b: 1px//c
				    2px;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],
	customSyntax: `postcss-scss`,

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
