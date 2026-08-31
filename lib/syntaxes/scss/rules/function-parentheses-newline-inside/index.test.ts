import { createRule } from "../../../../rules/function-parentheses-newline-inside/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, where the whitespace this option counts stands inside the text of the comment rather than in front of the parenthesis`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113
			description: `inline comment before the closing parenthesis: the parenthesis cannot join the comment's line, so the value is left alone and the warning stands`,
			code: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, 2px // keep me
					);
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejectedClosingMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/303
			description: `an inline comment whose text opens a call the parser closes a line below: the whitespace behind the opening parenthesis is the break that closes the comment and the indentation behind it, and nothing of the code the parser filed under that call, and the fix reaches no stretch of it, so nothing is written and the problem is reported`,
			code: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			fixed: `
				a {
					t: foo(// c(
						1px));
				}
			`,
			line: 2,
			column: 9,
			message: messages.rejectedOpeningMultiLine,
		},
	],
})
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which is left alone warning and all`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `a call the parser closed on a parenthesis standing in the text of an inline comment, and the call that text opens behind it: the break the option would write in front of that parenthesis is the break that closes the comment, so neither call is touched`,
			code: `
				a { t: foo(1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two parentheses with ordinary code behind the comment rather than a block comment: Sass compiles the value to one call reaching over the break, and the break the option would write would close the comment and make two calls of it`,
			code: `a { b: f(1px // c) h(2px\n2px); }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a closed call standing inside such a function, which is read and fixed where it stands`,
			code: `
				a {
					transform: translate(1px, calc(1 + 2) // a /*
					);
				}
			`,
			fixed: `
				a {
					transform: translate(1px, calc(
				1 + 2
				) // a /*
					);
				}
			`,
			warnings: [
				{
					line: 2,
					column: 33,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 37,
					message: messages.expectedClosing,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/131
			description: `a function the value parser marks unclosed, its closing parenthesis swallowed by a comment the file never closes, which the issue names under this option as well`,
			code: `
				a {
					transform: translate(1px, 2px // a /*
					);
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320
			description: `the same two calls with the outer one already broken behind its opening parenthesis, which leaves the parenthesis inside the comment the only one the option asks a break in front of`,
			code: `
				a { t: foo(
				1px // c) calc(/*b*/
				 ,2px
				); }
			`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value,key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value, value2)`,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken across lines, whose parentheses open no call`,
			code: `$map: (key: value,\nkey2: value2)`,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken on the inside of both parentheses`,
			code: `
				$map: (
				key: value,
				key2: value2
				)
			`,
		},
	],
})
