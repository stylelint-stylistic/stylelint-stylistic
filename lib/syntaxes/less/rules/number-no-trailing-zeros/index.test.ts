import { createRule } from "../../../../rules/number-no-trailing-zeros/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			// Sass compiles every spelling of the name to a plain address, and `lightningcss` reads one in every spelling too, so what stands inside the parentheses is a URL and nothing a rule may write to.
			description: `a trailing zero inside an address whose name an escape spells`,
			code: `a { b: u\\rl(1.50px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			description: `the same zero inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(1.50px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a trailing zero standing in the text of an inline comment the value holds`,
			code: `
				a { b: 1.5px // 1.50px
					1.5em; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `an address opened in the text of an inline comment and reaching past the break that closes it, which the rule passes over as it passes over every address`,
			code: `
				a { b: 1px // url(
					0.50px); }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a trailing zero standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 100px // 1.50px
				) { a { b: c } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a trailing zero a line below an inline comment, gathered by a call the parser opened inside that comment's text: the call is left alone and what it gathered is read where it stands`,
			code: `
				a { b: f(1.50px // c) calc(
					1.50em); }
			`,
			fixed: `
				a { b: f(1.5px // c) calc(
					1.5em); }
			`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a trailing zero on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: 1.50px // 1.50px
					1.50em; }
			`,
			fixed: `
				a { b: 1.5px // 1.50px
					1.5em; }
			`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `@foo: 1.50px;`,
			fixed: `@foo: 1.5px;`,
			line: 1,
			column: 10,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a trailing zero in a value the raw of which ends in an end-of-line comment and a line break`,
			code: `
				a { b: 1.50px // c
					; }
			`,
			fixed: `
				a { b: 1.5px // c
					; }
			`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			description: `a trailing zero on either side of a block comment the value of a Less at-variable holds`,
			code: `@foo: 1.50px /* c */ 2.50em;`,
			fixed: `@foo: 1.5px /* c */ 2.5em;`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 25,
					message: messages.rejected,
				},
			],
		},
	],
})
