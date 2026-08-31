import { createRule } from "../../../../rules/number-leading-zero/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a fraction with no leading zero standing in the text of an inline comment the value holds`,
			code: `
				a { b: 0.5px // .5px
					0.5em; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a fraction with no leading zero standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 1px // .5px
				) { a { b: c } }
			`,
		},
	],

	reject: [
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `@foo: .5px;`,
			fixed: `@foo: 0.5px;`,
			line: 1,
			column: 7,
			message: messages.expected,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-less`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			// Sass compiles every spelling of the name to a plain address, and `lightningcss` reads one in every spelling too, so what stands inside the parentheses is a URL and nothing a rule may write to.
			description: `a leading zero inside an address whose name an escape spells`,
			code: `a { b: u\\rl(0.5px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/344
			description: `the same zero inside an address whose name a hexadecimal escape spells, which the value parser hands the rule as a word and a call of two letters`,
			code: `a { b: \\75 rl(0.5px); }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a leading zero standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 1px // 0.5px
				) { a { b: c } }
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
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a leading zero a line below an inline comment, gathered by a call the parser opened inside that comment's text: the call is left alone and what it gathered is read where it stands`,
			code: `
				a { b: f(0.5px // c) calc(
					0.5em); }
			`,
			fixed: `
				a { b: f(.5px // c) calc(
					.5em); }
			`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 2,
					message: messages.rejected,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a leading zero on either side of an inline comment whose text holds one as well`,
			code: `
				a { b: 0.5px // 0.5px
					0.5em; }
			`,
			fixed: `
				a { b: .5px // 0.5px
					.5em; }
			`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 2,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `@foo: 0.5px;`,
			fixed: `@foo: .5px;`,
			line: 1,
			column: 7,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a leading zero in a value the raw of which ends in an end-of-line comment and a line break`,
			code: `
				a { b: 0.5px // c
					; }
			`,
			fixed: `
				a { b: .5px // c
					; }
			`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `a leading zero on either side of a block comment the value of a Less at-variable holds`,
			code: `@foo: 0.5px /* c */ 0.5em;`,
			fixed: `@foo: .5px /* c */ .5em;`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 21,
					message: messages.rejected,
				},
			],
		},
	],
})
