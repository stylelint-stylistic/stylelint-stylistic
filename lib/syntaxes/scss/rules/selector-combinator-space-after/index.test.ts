import { createRule } from "../../../../rules/selector-combinator-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `comments behind the combinators of a nested selector list`,
			code: `a { > /*comment*/a, > /*comment*/.b{} }`,
		},
		{
			description: `a combinator left dangling at the end of a nested selector`,
			code: `a ~, b {}`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list interleaved with an inline comment: the fix reaches the output`,
			code: `
				.a,
				// A comment.
				.b >.c {
					color: green;
				}
			`,
			fixed: `
				.a,
				// A comment.
				.b > .c {
					color: green;
				}
			`,
			line: 3,
			column: 4,
			message: messages.expectedAfter(`>`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`never`],

	accept: [
		{
			description: `comments behind the unspaced combinators of a nested selector list`,
			code: `a { >/*comment*/a, >/*comment*/.b {} }`,
		},
		{
			description: `a combinator left dangling at the end of a nested selector`,
			code: `a ~, b {}`,
		},
	],
})
