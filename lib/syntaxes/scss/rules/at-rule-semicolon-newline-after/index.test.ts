import { createRule } from "../../../../rules/at-rule-semicolon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no newline behind the semicolon of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@import "a" // c
					"b" ;@import "c";
			`,
			fixed: `
				@import "a" // c
					"b" ;
				@import "c";
			`,
			line: 2,
			column: 7,
			message: messages.expectedAfter(),
		},
	],
})
