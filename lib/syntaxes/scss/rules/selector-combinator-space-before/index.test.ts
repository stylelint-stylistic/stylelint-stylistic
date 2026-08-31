import { createRule } from "../../../../rules/selector-combinator-space-before/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			description: `a nested selector opening with a combinator`,
			code: `a {> a {}}`,
		},
		{
			description: `two nested selectors, each opening with a combinator`,
			code: `a {> a,> .b {}}`,
		},
		{
			description: `the same two selectors, each with a comment behind its combinator`,
			code: `a {> /*comment*/ a,> /*comment*/ .b {}}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `scss nesting, selector list interleaved with inline comments`,
			code: `
				.some_class {
					.blue,
					// There's a comment here.
					+ .green,
					// And another.
					> .purple {
						background: yellow;
					}
				}
			`,
		},
	],

	reject: [
		{
			description: `an inline comment standing in front of the combinator, reported where the source spells it and left as it is`,
			code: `.foo  // c\n  >  .bar { }`,
			fixed: `.foo  // c\n  >  .bar { }`,
			line: 2,
			column: 3,
			message: messages.expectedBefore(`>`),
		},
		{
			description: `a nested selector list whose last selector carries an unspaced combinator of its own`,
			code: `a {> /*comment*/ a,> /*comment*/ .b> .c {}}`,
			fixed: `a {> /*comment*/ a,> /*comment*/ .b > .c {}}`,
			line: 1,
			column: 36,
			message: messages.expectedBefore(`>`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list interleaved with an inline comment: the fix reaches the output`,
			code: `
				.a,
				// A comment.
				.b>.c {
					color: green;
				}
			`,
			fixed: `
				.a,
				// A comment.
				.b >.c {
					color: green;
				}
			`,
			line: 3,
			column: 3,
			message: messages.expectedBefore(`>`),
		},
	],
})
testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`never`],

	accept: [
		{
			description: `a nested selector opening with a combinator behind a space`,
			code: `a { > a {}}`,
		},
		{
			description: `two nested selectors, each opening with a spaced combinator`,
			code: `a { > a, > .b {}}`,
		},
		{
			description: `the same two selectors, each with a comment behind its combinator`,
			code: `a { > /*comment*/ a, > /*commenttest*/ .b {}}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `scss nesting, selector list interleaved with inline comments`,
			code: `
				.some_class {
					.blue,
					// There's a comment here.
					+ .green,
					// And another.
					> .purple {
						background: yellow;
					}
				}
			`,
		},
	],

	reject: [
		{
			description: `a nested selector list whose last selector carries a spaced combinator of its own`,
			code: `a { > /*comment*/ a, > /*comment*/ .b >.c {}}`,
			fixed: `a { > /*comment*/ a, > /*comment*/ .b>.c {}}`,
			line: 1,
			column: 39,
			message: messages.rejectedBefore(`>`),
		},
	],
})
