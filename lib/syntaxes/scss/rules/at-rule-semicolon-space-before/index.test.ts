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
			// See #139
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
		{
			// See #545
			description: `the same at-rule indented inside a declaration block, whose leading raw carries a break`,
			code: `
				a {
					@import "a" // c
						"b" ;
				}
			`,
			fixed: `
				a {
					@import "a" // c
						"b" ;
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBefore(),
		},
	],
})
