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
			description: `a space in front of the adjacent-sibling combinator and a newline after it`,
			code: `a +\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a +\r\na {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a >\na {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a ~\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a ~\r\na {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a >>>\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a >>>\r\na {}`,
		},
		{
			description: `two combinators, each with a space in front of it and none after`,
			code: `a ~a +bar {}`,
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
			description: `nested selectors that open with a combinator, each on its own line`,
			code: `
				.foo {
					> span,
					> b { color:pink; } }
			`,
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
			description: `an attribute selector the parser cannot read`,
			code: `a[b=#{c}] { }`,
		},
		{
			description: `a namespaced selector in front of a spaced child combinator`,
			code: `namespace|type#id > .foo {}`,
		},
		{
			description: `the same namespaced selector standing in a list`,
			code: `namespace|type#id > .foo {}, space|customtype#id_withunder > a {}`,
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
			description: `a comment the parser folds into the raws of the combinator, which the fix cannot write past`,
			code: `.foo  /* c */  >  .bar { }`,
			fixed: `.foo  /* c */  >  .bar { }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(`>`),
		},
		{
			description: `two spaces in front of the adjacent-sibling combinator`,
			code: `a  +a {}`,
			fixed: `a +a {}`,
			line: 1,
			column: 4,
			message: messages.expectedBefore(`+`),
		},
		{
			description: `a newline in front of the adjacent-sibling combinator`,
			code: `a\n+ a {}`,
			fixed: `a + a {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(`+`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n+ a {}`,
			fixed: `a + a {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(`+`),
		},
		{
			description: `no space in front of the adjacent-sibling combinator`,
			code: `a+a {}`,
			fixed: `a +a {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(`+`),
		},
		{
			description: `no space in front of the child combinator`,
			code: `a>a {}`,
			fixed: `a >a {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(`>`),
		},
		{
			description: `no space in front of the general-sibling combinator`,
			code: `a~a {}`,
			fixed: `a ~a {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(`~`),
		},
		{
			description: `no space in front of the second of two combinators`,
			code: `a + .foo.bar~ a {}`,
			fixed: `a + .foo.bar ~ a {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(`~`),
		},
		{
			description: `no space in front of the first of two combinators`,
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo + .foo.bar ~ a {}`,
			line: 1,
			column: 5,
			message: messages.expectedBefore(`+`),
		},
		{
			description: `no space in front of the shadow-piercing descendant combinator`,
			code: `a>>> a {}`,
			fixed: `a >>> a {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(`>>>`),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
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
			description: `two combinators, each with a space after it and none in front`,
			code: `.foo~ a+ bar {}`,
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
			description: `no space in front of the adjacent-sibling combinator and a newline after it`,
			code: `a+\na {}`,
		},
		{
			description: `the same around the child combinator`,
			code: `a>\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a>\r\na {}`,
		},
		{
			description: `the same around the general-sibling combinator`,
			code: `a~\na {}`,
		},
		{
			description: `the same around the shadow-piercing descendant combinator`,
			code: `a>>>\na {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a>>>\r\na {}`,
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
			code: `namespace|type#id> .foo {}`,
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
			description: `a space in front of the adjacent-sibling combinator`,
			code: `a +a {}`,
			fixed: `a+a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(`+`),
		},
		{
			description: `a space in front of the child combinator`,
			code: `a >a {}`,
			fixed: `a>a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(`>`),
		},
		{
			description: `a space in front of the general-sibling combinator`,
			code: `a ~a {}`,
			fixed: `a~a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(`~`),
		},
		{
			description: `a newline in front of the adjacent-sibling combinator`,
			code: `a\n+a {}`,
			fixed: `a+a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`+`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n+a {}`,
			fixed: `a+a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`+`),
		},
		{
			description: `a newline in front of the child combinator`,
			code: `a\n>a {}`,
			fixed: `a>a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`>`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n>a {}`,
			fixed: `a>a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`>`),
		},
		{
			description: `a newline in front of the general-sibling combinator`,
			code: `a\n~a {}`,
			fixed: `a~a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`~`),
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a\r\n~a {}`,
			fixed: `a~a {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(`~`),
		},
		{
			description: `a space in front of the first of two combinators`,
			code: `a + .foo.bar~ a {}`,
			fixed: `a+ .foo.bar~ a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(`+`),
		},
		{
			description: `a space in front of the second of two combinators`,
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo+ .foo.bar~ a {}`,
			line: 1,
			column: 16,
			message: messages.rejectedBefore(`~`),
		},
		{
			description: `a space in front of the shadow-piercing descendant combinator`,
			code: `a >>> a {}`,
			fixed: `a>>> a {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(`>>>`),
		},
	],
})

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
