import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

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
