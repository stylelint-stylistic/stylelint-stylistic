import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a + a {}`,
			description: `a space on either side of the adjacent-sibling combinator`,
		},
		{
			code: `a > a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a ~ a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a >>> a {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `.foo ~ a + bar {}`,
			description: `two combinators, each with a space on either side`,
		},
		{
			code: `a+ a {}`,
			description: `a space after the adjacent-sibling combinator and none in front of it`,
		},
		{
			code: `a> a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a~ a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a>>> a {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `a\n+ a {}`,
			description: `a newline in front of the adjacent-sibling combinator and a space after it`,
		},
		{
			code: `a\r\n+ a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n> a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a\r\n> a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n~ a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a\n>>> a {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `a\r\n>>> a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a~ a+ bar {}`,
			description: `two combinators, each with a space after it and none in front`,
		},
		{
			code: `.foo:nth-child(2n+1) {}`,
			description: `a plus sign inside the argument of a pseudo-class, which is no combinator`,
		},
		{
			code: `.foo:nth-child(2n-1) {}`,
			description: `a minus sign inside the argument of a pseudo-class`,
		},
		{
			code: `a[rel~='copyright'] {}`,
			description: `a tilde inside an attribute operator, which is no combinator either`,
		},
		{
			code: `.foo\\+bar {}`,
			description: `an escaped plus sign inside a class name`,
		},
		{
			code: `a [type='button'] {}`,
			description: `a descendant combinator in front of an attribute selector, which this rule does not measure`,
		},
		{
			code: `a  a {}`,
			description: `two spaces standing for a descendant combinator`,
		},
		{
			code: `a\na {}`,
			description: `a newline standing for a descendant combinator`,
		},
		{
			code: `a\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n\na {}`,
			description: `two newlines standing for a descendant combinator`,
		},
		{
			code: `a\r\n\r\na {}`,
			description: `the same written with carriage-return line breaks`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `a custom property under the root selector, whose value the rule does not read`,
		},
		{
			code: `html { --foo: 1px; }`,
			description: `a custom property under a type selector`,
		},
		{
			code: `:root { --custom-property-set: {} }`,
			description: `a custom property set under the root selector`,
		},
		{
			code: `html { --custom-property-set: {} }`,
			description: `a custom property set under a type selector`,
		},
		{
			code: `namespace|type#id > .foo {}`,
			description: `a namespaced selector in front of a spaced child combinator`,
		},
		{
			code: `.a { &.b {} }`,
			description: `a nested selector joined to the parent with no combinator`,
		},
		{
			code: `.a { & .b {} }`,
			description: `a nested selector standing behind a descendant combinator`,
		},
		{
			code: `.a { &:first-child {} }`,
			description: `a nested selector carrying a pseudo-class`,
		},
		{
			code: `a[b=#{c}] { }`,
			description: `an attribute selector the parser cannot read`,
		},
	],

	reject: [
		{
			code: `a+  a {}`,
			fixed: `a+ a {}`,
			description: `two spaces after the adjacent-sibling combinator`,
			message: messages.expectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a+\na {}`,
			fixed: `a+ a {}`,
			description: `a newline after the adjacent-sibling combinator`,
			message: messages.expectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a+a {}`,
			fixed: `a+ a {}`,
			description: `no space after the adjacent-sibling combinator`,
			message: messages.expectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a>a {}`,
			fixed: `a> a {}`,
			description: `no space after the child combinator`,
			message: messages.expectedAfter(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a~a {}`,
			fixed: `a~ a {}`,
			description: `no space after the general-sibling combinator`,
			message: messages.expectedAfter(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a + .foo.bar ~a {}`,
			fixed: `a + .foo.bar ~ a {}`,
			description: `no space after the second of two combinators`,
			message: messages.expectedAfter(`~`),
			line: 1,
			column: 14,
		},
		{
			code: `#foo +.foo.bar ~ a {}`,
			fixed: `#foo + .foo.bar ~ a {}`,
			description: `no space after the first of two combinators`,
			message: messages.expectedAfter(`+`),
			line: 1,
			column: 6,
		},
		{
			code: `a >>>a {}`,
			fixed: `a >>> a {}`,
			description: `no space after the shadow-piercing descendant combinator`,
			message: messages.expectedAfter(`>>>`),
			line: 1,
			column: 3,
		},
		{
			code: `namespace|type#id >.foo {}`,
			fixed: `namespace|type#id > .foo {}`,
			description: `no space after a child combinator standing behind a namespaced selector`,
			message: messages.expectedAfter(`>`),
			line: 1,
			column: 19,
		},
		{
			code: `a >a >a {}`,
			fixed: `a > a > a {}`,
			description: `no space after either of two child combinators`,
			warnings: [
				{
					message: messages.expectedAfter(`>`),
					line: 1,
					column: 3,
				},
				{
					message: messages.expectedAfter(`>`),
					line: 1,
					column: 6,
				},
			],
		},
		{
			code: `.a { &>.b {} }`,
			fixed: `.a { &> .b {} }`,
			description: `no space after a child combinator inside a nested selector`,
			message: messages.expectedAfter(`>`),
			line: 1,
			column: 7,
		},
		{
			code: `.a { &+.b {} }`,
			fixed: `.a { &+ .b {} }`,
			description: `no space after an adjacent-sibling combinator inside a nested selector`,
			message: messages.expectedAfter(`+`),
			line: 1,
			column: 7,
		},
		{
			code: `a/*comment*/>/*comment*/a {}`,
			fixed: `a/*comment*/> /*comment*/a {}`,
			description: `comments on either side of a child combinator, with no space anywhere`,
			message: messages.expectedAfter(`>`),
			line: 1,
			column: 13,
		},
		{
			code: `a/*comment*/>/*comment*/a, b/*comment*/>/*comment*/b {}`,
			fixed: `a/*comment*/> /*comment*/a, b/*comment*/> /*comment*/b {}`,
			description: `the same in both selectors of a list`,
			warnings: [
				{
					message: messages.expectedAfter(`>`),
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedAfter(`>`),
					line: 1,
					column: 40,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a +a {}`,
			description: `a space in front of the adjacent-sibling combinator and none after it`,
		},
		{
			code: `a >a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a ~a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a >>>a {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `.foo ~a +bar {}`,
			description: `two combinators, each with a space in front of it and none after`,
		},
		{
			code: `a+a {}`,
			description: `no space on either side of the adjacent-sibling combinator`,
		},
		{
			code: `a>a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a~a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a\n+a {}`,
			description: `a newline in front of the adjacent-sibling combinator and no space after it`,
		},
		{
			code: `a\r\n+a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n>a {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a\n~a {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a\r\n~a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n>>>a {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `a\r\n>>>a {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `.foo:nth-child(2n + 1) {}`,
			description: `a spaced plus sign inside the argument of a pseudo-class, which is no combinator`,
		},
		{
			code: `.foo:nth-child(2n - 1) {}`,
			description: `a spaced minus sign inside the argument of a pseudo-class`,
		},
		{
			code: `a[rel~='copyright'] {}`,
			description: `a tilde inside an attribute operator, which is no combinator either`,
		},
		{
			code: `a [type='button'] {}`,
			description: `a descendant combinator in front of an attribute selector, which this rule does not measure`,
		},
		{
			code: `a  a {}`,
			description: `two spaces standing for a descendant combinator`,
		},
		{
			code: `a\na {}`,
			description: `a newline standing for a descendant combinator`,
		},
		{
			code: `a\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a\n\na {}`,
			description: `two newlines standing for a descendant combinator`,
		},
		{
			code: `a\r\n\r\na {}`,
			description: `the same written with carriage-return line breaks`,
		},
		{
			code: `namespace|type#id >.foo {}`,
			description: `a namespaced selector in front of an unspaced child combinator`,
		},
	],

	reject: [
		{
			code: `a+ a {}`,
			fixed: `a+a {}`,
			description: `a space after the adjacent-sibling combinator`,
			message: messages.rejectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a> a {}`,
			fixed: `a>a {}`,
			description: `a space after the child combinator`,
			message: messages.rejectedAfter(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a~ a {}`,
			fixed: `a~a {}`,
			description: `a space after the general-sibling combinator`,
			message: messages.rejectedAfter(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a+\na{}`,
			fixed: `a+a{}`,
			description: `a newline after the adjacent-sibling combinator`,
			message: messages.rejectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a+\r\na{}`,
			fixed: `a+a{}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedAfter(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a>\na{}`,
			fixed: `a>a{}`,
			description: `a newline after the child combinator`,
			message: messages.rejectedAfter(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a>\r\na{}`,
			fixed: `a>a{}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedAfter(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a~\na{}`,
			fixed: `a~a{}`,
			description: `a newline after the general-sibling combinator`,
			message: messages.rejectedAfter(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a~\r\na{}`,
			fixed: `a~a{}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedAfter(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a + .foo.bar ~a {}`,
			fixed: `a +.foo.bar ~a {}`,
			description: `a space after the first of two combinators`,
			message: messages.rejectedAfter(`+`),
			line: 1,
			column: 3,
		},
		{
			code: `#foo +.foo.bar ~ a {}`,
			fixed: `#foo +.foo.bar ~a {}`,
			description: `a space after the second of two combinators`,
			message: messages.rejectedAfter(`~`),
			line: 1,
			column: 16,
		},
		{
			code: `a >>> a {}`,
			fixed: `a >>>a {}`,
			description: `a space after the shadow-piercing descendant combinator`,
			message: messages.rejectedAfter(`>>>`),
			line: 1,
			column: 3,
		},
		{
			code: `a/*comment*/ > /*comment*/a {}`,
			fixed: `a/*comment*/ >/*comment*/a {}`,
			description: `comments on either side of a spaced child combinator`,
			message: messages.rejectedAfter(`>`),
			line: 1,
			column: 14,
		},
		{
			code: `a/*comment*/ > /*comment*/a, b/*comment*/ > /*comment*/b {}`,
			fixed: `a/*comment*/ >/*comment*/a, b/*comment*/ >/*comment*/b {}`,
			description: `the same in both selectors of a list`,
			warnings: [
				{
					message: messages.rejectedAfter(`>`),
					line: 1,
					column: 14,
				},
				{
					message: messages.rejectedAfter(`>`),
					line: 1,
					column: 43,
				},
			],
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-less`,
	config: [`always`],

	accept: [
		{
			code: `.a when (@size>=60) and (@size<102) {}`,
			description: `a Less guard, whose comparisons are no combinators`,
		},
	],

	reject: [
		{
			code: `a+  a {}`,
			fixed: `a+ a {}`,
			description: `two spaces after the adjacent-sibling combinator`,
			message: messages.expectedAfter(`+`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			code: `a { > /*comment*/a, > /*comment*/.b{} }`,
			description: `comments behind the combinators of a nested selector list`,
		},
		{
			code: `a ~, b {}`,
			description: `a combinator left dangling at the end of a nested selector`,
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
			message: messages.expectedAfter(`>`),
			line: 3,
			column: 4,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`never`],

	accept: [
		{
			code: `a { >/*comment*/a, >/*comment*/.b {} }`,
			description: `comments behind the unspaced combinators of a nested selector list`,
		},
		{
			code: `a ~, b {}`,
			description: `a combinator left dangling at the end of a nested selector`,
		},
	],
})
