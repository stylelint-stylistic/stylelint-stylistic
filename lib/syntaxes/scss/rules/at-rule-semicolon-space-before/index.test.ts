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
					"b";
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
						"b";
				}
			`,
			line: 3,
			column: 6,
			message: messages.rejectedBefore(),
		},
		{
			// See #697
			description: `an at-rule ending in an inline comment, whose closing break the fix would write over, putting the semicolon inside the comment`,
			code: `@import "x" // c\n;`,
			fixed: `@import "x" // c\n;`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// See #697
			description: `an at-rule ending in an inline comment, whose closing break the fix would write over, putting the semicolon inside the comment`,
			code: `@import "x" // c\n;`,
			fixed: `@import "x" // c\n;`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a module load the fix does space`,
			code: `@use "sass:math";`,
			fixed: `@use "sass:math" ;`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
	],
})
