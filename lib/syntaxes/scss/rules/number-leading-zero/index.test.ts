import { createRule } from "../../../../rules/number-leading-zero/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

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
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a fraction with no leading zero on either side of an end-of-line comment the value holds`,
			code: `
				a { b: .50px // c
					.5em; }
			`,
			fixed: `
				a { b: 0.50px // c
					0.5em; }
			`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.expected,
				},
				{
					line: 2,
					column: 2,
					message: messages.expected,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a leading zero standing in the text of an inline comment the value holds`,
			code: `
				a { b: .5px // 0.5px
					.5em; }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/271
			description: `a leading zero standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 1px // 0.5px
				) { a { b: c } }
			`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a leading zero standing behind an end-of-line comment the value holds`,
			code: `
				a { b: 1px // c
					0.5em; }
			`,
			fixed: `
				a { b: 1px // c
					.5em; }
			`,
			line: 2,
			column: 2,
			message: messages.rejected,
		},
	],
})
