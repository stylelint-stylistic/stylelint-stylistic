import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space on either side of the adjacent-sibling combinator`,
			code: `a + a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a > a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a ~ a {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a >>> a {}`,
		},
		{
			description: `two combinators, each with a space on either side`,
			code: `.foo ~ a + bar {}`,
		},
		{
			description: `a space after the adjacent-sibling combinator and none in front of it`,
			code: `a+ a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a> a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a~ a {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a>>> a {}`,
		},
		{
			description: `a newline in front of the adjacent-sibling combinator and a space after it`,
			code: `a\n+ a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n+ a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a\n> a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n> a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a\n~ a {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a\n>>> a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n>>> a {}`,
		},
		{
			description: `two combinators, each with a space after it and none in front`,
			code: `a~ a+ bar {}`,
		},
		{
			description: `a plus sign inside the argument of a pseudo-class, which is no combinator`,
			code: `.foo:nth-child(2n+1) {}`,
		},
		{
			description: `a minus sign inside the argument of a pseudo-class`,
			code: `.foo:nth-child(2n-1) {}`,
		},
		{
			description: `a tilde inside an attribute operator, which is no combinator either`,
			code: `a[rel~='copyright'] {}`,
		},
		{
			description: `an escaped plus sign inside a class name`,
			code: `.foo\\+bar {}`,
		},
		{
			description: `a descendant combinator in front of an attribute selector, which this rule does not measure`,
			code: `a [type='button'] {}`,
		},
		{
			description: `two spaces standing for a descendant combinator`,
			code: `a  a {}`,
		},
		{
			description: `a newline standing for a descendant combinator`,
			code: `a\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\na {}`,
		},
		{
			description: `two newlines standing for a descendant combinator`,
			code: `a\n\na {}`,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `a\r\n\r\na {}`,
		},
		{
			description: `a custom property under the root selector, whose value the rule does not read`,
			code: `:root { --foo: 1px; }`,
		},
		{
			description: `a custom property under a type selector`,
			code: `html { --foo: 1px; }`,
		},
		{
			description: `a custom property set under the root selector`,
			code: `:root { --custom-property-set: {} }`,
		},
		{
			description: `a custom property set under a type selector`,
			code: `html { --custom-property-set: {} }`,
		},
		{
			description: `a namespaced selector in front of a spaced child combinator`,
			code: `namespace|type#id > .foo {}`,
		},
		{
			description: `a nested selector joined to the parent with no combinator`,
			code: `.a { &.b {} }`,
		},
		{
			description: `a nested selector standing behind a descendant combinator`,
			code: `.a { & .b {} }`,
		},
		{
			description: `a nested selector carrying a pseudo-class`,
			code: `.a { &:first-child {} }`,
		},
		{
			description: `an attribute selector the parser cannot read`,
			code: `a[b=#{c}] { }`,
		},
	],

	reject: [
		{
			description: `two spaces after the adjacent-sibling combinator`,
			code: `a+  a {}`,
			fixed: `a+ a {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(`+`),
		},
		{
			description: `a newline after the adjacent-sibling combinator`,
			code: `a+\na {}`,
			fixed: `a+ a {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(`+`),
		},
		{
			description: `no space after the adjacent-sibling combinator`,
			code: `a+a {}`,
			fixed: `a+ a {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(`+`),
		},
		{
			description: `no space after the child combinator`,
			code: `a>a {}`,
			fixed: `a> a {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(`>`),
		},
		{
			description: `no space after the general-sibling combinator`,
			code: `a~a {}`,
			fixed: `a~ a {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(`~`),
		},
		{
			description: `no space after the second of two combinators`,
			code: `a + .foo.bar ~a {}`,
			fixed: `a + .foo.bar ~ a {}`,
			line: 1,
			column: 14,
			message: messages.expectedAfter(`~`),
		},
		{
			description: `no space after the first of two combinators`,
			code: `#foo +.foo.bar ~ a {}`,
			fixed: `#foo + .foo.bar ~ a {}`,
			line: 1,
			column: 6,
			message: messages.expectedAfter(`+`),
		},
		{
			description: `no space after the shadow-piercing descendant combinator`,
			code: `a >>>a {}`,
			fixed: `a >>> a {}`,
			line: 1,
			column: 3,
			message: messages.expectedAfter(`>>>`),
		},
		{
			description: `no space after a child combinator standing behind a namespaced selector`,
			code: `namespace|type#id >.foo {}`,
			fixed: `namespace|type#id > .foo {}`,
			line: 1,
			column: 19,
			message: messages.expectedAfter(`>`),
		},
		{
			description: `no space after either of two child combinators`,
			code: `a >a >a {}`,
			fixed: `a > a > a {}`,
			warnings: [
				{
					line: 1,
					column: 3,
					message: messages.expectedAfter(`>`),
				},
				{
					line: 1,
					column: 6,
					message: messages.expectedAfter(`>`),
				},
			],
		},
		{
			description: `no space after a child combinator inside a nested selector`,
			code: `.a { &>.b {} }`,
			fixed: `.a { &> .b {} }`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`>`),
		},
		{
			description: `no space after an adjacent-sibling combinator inside a nested selector`,
			code: `.a { &+.b {} }`,
			fixed: `.a { &+ .b {} }`,
			line: 1,
			column: 7,
			message: messages.expectedAfter(`+`),
		},
		{
			description: `comments on either side of a child combinator, with no space anywhere`,
			code: `a/*comment*/>/*comment*/a {}`,
			fixed: `a/*comment*/> /*comment*/a {}`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(`>`),
		},
		{
			description: `the same in both selectors of a list`,
			code: `a/*comment*/>/*comment*/a, b/*comment*/>/*comment*/b {}`,
			fixed: `a/*comment*/> /*comment*/a, b/*comment*/> /*comment*/b {}`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.expectedAfter(`>`),
				},
				{
					line: 1,
					column: 40,
					message: messages.expectedAfter(`>`),
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
			description: `a space in front of the adjacent-sibling combinator and none after it`,
			code: `a +a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a >a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a ~a {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a >>>a {}`,
		},
		{
			description: `two combinators, each with a space in front of it and none after`,
			code: `.foo ~a +bar {}`,
		},
		{
			description: `no space on either side of the adjacent-sibling combinator`,
			code: `a+a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a>a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a~a {}`,
		},
		{
			description: `a newline in front of the adjacent-sibling combinator and no space after it`,
			code: `a\n+a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n+a {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a\n>a {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a\n~a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n~a {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a\n>>>a {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n>>>a {}`,
		},
		{
			description: `a spaced plus sign inside the argument of a pseudo-class, which is no combinator`,
			code: `.foo:nth-child(2n + 1) {}`,
		},
		{
			description: `a spaced minus sign inside the argument of a pseudo-class`,
			code: `.foo:nth-child(2n - 1) {}`,
		},
		{
			description: `a tilde inside an attribute operator, which is no combinator either`,
			code: `a[rel~='copyright'] {}`,
		},
		{
			description: `a descendant combinator in front of an attribute selector, which this rule does not measure`,
			code: `a [type='button'] {}`,
		},
		{
			description: `two spaces standing for a descendant combinator`,
			code: `a  a {}`,
		},
		{
			description: `a newline standing for a descendant combinator`,
			code: `a\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\na {}`,
		},
		{
			description: `two newlines standing for a descendant combinator`,
			code: `a\n\na {}`,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `a\r\n\r\na {}`,
		},
		{
			description: `a namespaced selector in front of an unspaced child combinator`,
			code: `namespace|type#id >.foo {}`,
		},
	],

	reject: [
		{
			description: `a space after the adjacent-sibling combinator`,
			code: `a+ a {}`,
			fixed: `a+a {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`+`),
		},
		{
			description: `a space after the child combinator`,
			code: `a> a {}`,
			fixed: `a>a {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`>`),
		},
		{
			description: `a space after the general-sibling combinator`,
			code: `a~ a {}`,
			fixed: `a~a {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`~`),
		},
		{
			description: `a newline after the adjacent-sibling combinator`,
			code: `a+\na{}`,
			fixed: `a+a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`+`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a+\r\na{}`,
			fixed: `a+a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`+`),
		},
		{
			description: `a newline after the child combinator`,
			code: `a>\na{}`,
			fixed: `a>a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`>`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a>\r\na{}`,
			fixed: `a>a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`>`),
		},
		{
			description: `a newline after the general-sibling combinator`,
			code: `a~\na{}`,
			fixed: `a~a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`~`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a~\r\na{}`,
			fixed: `a~a{}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(`~`),
		},
		{
			description: `a space after the first of two combinators`,
			code: `a + .foo.bar ~a {}`,
			fixed: `a +.foo.bar ~a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfter(`+`),
		},
		{
			description: `a space after the second of two combinators`,
			code: `#foo +.foo.bar ~ a {}`,
			fixed: `#foo +.foo.bar ~a {}`,
			line: 1,
			column: 16,
			message: messages.rejectedAfter(`~`),
		},
		{
			description: `a space after the shadow-piercing descendant combinator`,
			code: `a >>> a {}`,
			fixed: `a >>>a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedAfter(`>>>`),
		},
		{
			description: `comments on either side of a spaced child combinator`,
			code: `a/*comment*/ > /*comment*/a {}`,
			fixed: `a/*comment*/ >/*comment*/a {}`,
			line: 1,
			column: 14,
			message: messages.rejectedAfter(`>`),
		},
		{
			description: `the same in both selectors of a list`,
			code: `a/*comment*/ > /*comment*/a, b/*comment*/ > /*comment*/b {}`,
			fixed: `a/*comment*/ >/*comment*/a, b/*comment*/ >/*comment*/b {}`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejectedAfter(`>`),
				},
				{
					line: 1,
					column: 43,
					message: messages.rejectedAfter(`>`),
				},
			],
		},
	],
})

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
