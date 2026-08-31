import { createRule } from "../../../../rules/number-no-trailing-zeros/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	accept: [
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
			description: `a trailing zero standing in the text of an inline comment a set of media parameters holds`,
			code: `
				@media (min-width: 100px // 1.50px
				) { a { b: c } }
			`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/268
		{
			description: `a trailing zero standing behind an end-of-line comment the value holds`,
			code: `
				a { b: 1px // c
					0.50em; }
			`,
			fixed: `
				a { b: 1px // c
					0.5em; }
			`,
			line: 2,
			column: 5,
			message: messages.rejected,
		},
	],
})
