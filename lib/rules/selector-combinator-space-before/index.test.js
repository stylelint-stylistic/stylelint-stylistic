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
			code: `a +\na {}`,
			description: `a space in front of the adjacent-sibling combinator and a newline after it`,
		},
		{
			code: `a +\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a >\na {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a ~\na {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a ~\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a >>>\na {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `a >>>\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a ~a +bar {}`,
			description: `two combinators, each with a space in front of it and none after`,
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
			code: `
				.foo {
					> span,
					> b { color:pink; } }
			`,
			description: `nested selectors that open with a combinator, each on its own line`,
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
			code: `a[b=#{c}] { }`,
			description: `an attribute selector the parser cannot read`,
		},
		{
			code: `namespace|type#id > .foo {}`,
			description: `a namespaced selector in front of a spaced child combinator`,
		},
		{
			code: `namespace|type#id > .foo {}, space|customtype#id_withunder > a {}`,
			description: `the same namespaced selector standing in a list`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list whose second selector begins with a comment and a combinator`,
			code: `
				.a,
				/* A comment. */
				+ .b {}
			`,
		},
	],

	reject: [
		{
			code: `.foo  /* c */  >  .bar { }`,
			fixed: `.foo  /* c */  >  .bar { }`,
			description: `a comment the parser folds into the raws of the combinator, which the fix cannot write past`,
			message: messages.expectedBefore(`>`),
			line: 1,
			column: 16,
		},
		{
			code: `a  +a {}`,
			fixed: `a +a {}`,
			description: `two spaces in front of the adjacent-sibling combinator`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 4,
		},
		{
			code: `a\n+ a {}`,
			fixed: `a + a {}`,
			description: `a newline in front of the adjacent-sibling combinator`,
			message: messages.expectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n+ a {}`,
			fixed: `a + a {}`,
			description: `the same written with a carriage-return line break`,
			message: messages.expectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a+a {}`,
			fixed: `a +a {}`,
			description: `no space in front of the adjacent-sibling combinator`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a>a {}`,
			fixed: `a >a {}`,
			description: `no space in front of the child combinator`,
			message: messages.expectedBefore(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a~a {}`,
			fixed: `a ~a {}`,
			description: `no space in front of the general-sibling combinator`,
			message: messages.expectedBefore(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a + .foo.bar~ a {}`,
			fixed: `a + .foo.bar ~ a {}`,
			description: `no space in front of the second of two combinators`,
			message: messages.expectedBefore(`~`),
			line: 1,
			column: 13,
		},
		{
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo + .foo.bar ~ a {}`,
			description: `no space in front of the first of two combinators`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 5,
		},
		{
			code: `a>>> a {}`,
			fixed: `a >>> a {}`,
			description: `no space in front of the shadow-piercing descendant combinator`,
			message: messages.expectedBefore(`>>>`),
			line: 1,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
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
			code: `.foo~ a+ bar {}`,
			description: `two combinators, each with a space after it and none in front`,
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
			code: `a+\na {}`,
			description: `no space in front of the adjacent-sibling combinator and a newline after it`,
		},
		{
			code: `a>\na {}`,
			description: `the same around the child combinator`,
		},
		{
			code: `a>\r\na {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a~\na {}`,
			description: `the same around the general-sibling combinator`,
		},
		{
			code: `a>>>\na {}`,
			description: `the same around the shadow-piercing descendant combinator`,
		},
		{
			code: `a>>>\r\na {}`,
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
			code: `namespace|type#id> .foo {}`,
			description: `a namespaced selector in front of an unspaced child combinator`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list whose second selector begins with a comment and a combinator`,
			code: `
				.a,
				/* A comment. */
				+ .b {}
			`,
		},
	],

	reject: [
		{
			code: `a +a {}`,
			fixed: `a+a {}`,
			description: `a space in front of the adjacent-sibling combinator`,
			message: messages.rejectedBefore(`+`),
			line: 1,
			column: 3,
		},
		{
			code: `a >a {}`,
			fixed: `a>a {}`,
			description: `a space in front of the child combinator`,
			message: messages.rejectedBefore(`>`),
			line: 1,
			column: 3,
		},
		{
			code: `a ~a {}`,
			fixed: `a~a {}`,
			description: `a space in front of the general-sibling combinator`,
			message: messages.rejectedBefore(`~`),
			line: 1,
			column: 3,
		},
		{
			code: `a\n+a {}`,
			fixed: `a+a {}`,
			description: `a newline in front of the adjacent-sibling combinator`,
			message: messages.rejectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n+a {}`,
			fixed: `a+a {}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\n>a {}`,
			fixed: `a>a {}`,
			description: `a newline in front of the child combinator`,
			message: messages.rejectedBefore(`>`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n>a {}`,
			fixed: `a>a {}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedBefore(`>`),
			line: 2,
			column: 1,
		},
		{
			code: `a\n~a {}`,
			fixed: `a~a {}`,
			description: `a newline in front of the general-sibling combinator`,
			message: messages.rejectedBefore(`~`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n~a {}`,
			fixed: `a~a {}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejectedBefore(`~`),
			line: 2,
			column: 1,
		},
		{
			code: `a + .foo.bar~ a {}`,
			fixed: `a+ .foo.bar~ a {}`,
			description: `a space in front of the first of two combinators`,
			message: messages.rejectedBefore(`+`),
			line: 1,
			column: 3,
		},
		{
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo+ .foo.bar~ a {}`,
			description: `a space in front of the second of two combinators`,
			message: messages.rejectedBefore(`~`),
			line: 1,
			column: 16,
		},
		{
			code: `a >>> a {}`,
			fixed: `a>>> a {}`,
			description: `a space in front of the shadow-piercing descendant combinator`,
			message: messages.rejectedBefore(`>>>`),
			line: 1,
			column: 3,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66
			description: `selector list whose second selector begins with a comment and a combinator`,
			code: `
				.a,
				/* A comment. */
				+ .b {}
			`,
		},
	],

	reject: [
		{
			code: `a  +a {}`,
			fixed: `a +a {}`,
			description: `two spaces in front of the adjacent-sibling combinator`,
			message: messages.expectedBefore(`+`),
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`always`],

	accept: [
		{
			code: `a {> a {}}`,
			description: `a nested selector opening with a combinator`,
		},
		{
			code: `a {> a,> .b {}}`,
			description: `two nested selectors, each opening with a combinator`,
		},
		{
			code: `a {> /*comment*/ a,> /*comment*/ .b {}}`,
			description: `the same two selectors, each with a comment behind its combinator`,
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
			code: `.foo  // c\n  >  .bar { }`,
			fixed: `.foo  // c\n  >  .bar { }`,
			description: `an inline comment standing in front of the combinator, reported where the source spells it and left as it is`,
			message: messages.expectedBefore(`>`),
			line: 2,
			column: 3,
		},
		{
			code: `a {> /*comment*/ a,> /*comment*/ .b> .c {}}`,
			fixed: `a {> /*comment*/ a,> /*comment*/ .b > .c {}}`,
			description: `a nested selector list whose last selector carries an unspaced combinator of its own`,
			message: messages.expectedBefore(`>`),
			line: 1,
			column: 36,
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
			message: messages.expectedBefore(`>`),
			line: 3,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	customSyntax: `postcss-scss`,
	config: [`never`],

	accept: [
		{
			code: `a { > a {}}`,
			description: `a nested selector opening with a combinator behind a space`,
		},
		{
			code: `a { > a, > .b {}}`,
			description: `two nested selectors, each opening with a spaced combinator`,
		},
		{
			code: `a { > /*comment*/ a, > /*commenttest*/ .b {}}`,
			description: `the same two selectors, each with a comment behind its combinator`,
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
			code: `a { > /*comment*/ a, > /*comment*/ .b >.c {}}`,
			fixed: `a { > /*comment*/ a, > /*comment*/ .b>.c {}}`,
			description: `a nested selector list whose last selector carries a spaced combinator of its own`,
			message: messages.rejectedBefore(`>`),
			line: 1,
			column: 39,
		},
	],
})
