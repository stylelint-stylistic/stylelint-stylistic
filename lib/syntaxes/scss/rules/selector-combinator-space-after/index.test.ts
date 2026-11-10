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
		{
			// `postcss-scss` does not capture a `//` comment that sits directly behind the combinator, so the rule used to skip the selector as non-standard
			description: `a combinator directly followed by an inline comment, which the rule now reads`,
			code: `a>// c\nb { c: d }`,
			fixed: `a> // c\nb { c: d }`,
			line: 1,
			column: 2,
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
