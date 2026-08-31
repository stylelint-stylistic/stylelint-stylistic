import { createRule } from "../../../../rules/at-rule-semicolon-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a space in front of the semicolon of an at-rule whose parameters carry on past an inline comment, which this syntax keeps a second copy of`,
			code: `
				@import "a" // c
					"b" ;
			`,
			fixed: `
				@import "a" // c
					"b" ;
			`,
			line: 2,
			column: 5,
			message: messages.rejectedBefore(),
		},
	],
})
