import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: true })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a + a {}`,
			description: `space before and after + combinator`,
		},
		{
			code: `a > a {}`,
			description: `space before and after > combinator`,
		},
		{
			code: `a ~ a {}`,
			description: `space before and after ~ combinator`,
		},
		{
			code: `a >>> a {}`,
			description: `shadow-piercing descendant combinator`,
		},
		{
			code: `.foo ~ a + bar {}`,
			description: `multiple spaced combinators`,
		},
		{
			code: `a +a {}`,
			description: `space before and none after + combinator`,
		},
		{
			code: `a >a {}`,
			description: `space before and none after > combinator`,
		},
		{
			code: `a ~a {}`,
			description: `space before and none after ~ combinator`,
		},
		{
			code: `a >>>a {}`,
			description: `space before and none after >>> combinator`,
		},
		{
			code: `a +\na {}`,
			description: `space before and newline after + combinator`,
		},
		{
			code: `a +\r\na {}`,
			description: `space before and CRLF after + combinator`,
		},
		{
			code: `a >\na {}`,
			description: `space before and newline after > combinator`,
		},
		{
			code: `a ~\na {}`,
			description: `space before and newline after ~ combinator`,
		},
		{
			code: `a ~\r\na {}`,
			description: `space before and CRLF after ~ combinator`,
		},
		{
			code: `a >>>\na {}`,
			description: `space before and newline after >>> combinator`,
		},
		{
			code: `a >>>\r\na {}`,
			description: `space before and CRLF after >>> combinator`,
		},
		{
			code: `a ~a +bar {}`,
			description: `multiple combinators with space before and none after`,
		},
		{
			code: `.foo:nth-child(2n+1) {}`,
			description: `unspaced + in nth-child argument`,
		},
		{
			code: `.foo:nth-child(2n-1) {}`,
			description: `unspaced - in nth-child argument`,
		},
		{
			code: `a[rel~='copyright'] {}`,
			description: `attribute selector with ~=`,
		},
		{
			code: `.foo {\n\t> span,\n\t> b { color:pink; } }`,
			description: `nested selectors starting with combinator`,
		},
		{
			code: `.foo\\+bar {}`,
			description: `escaped combinator-like character`,
		},
		{
			code: `a [type='button'] {}`,
			description: `combinator between selectors and attribute selector`,
		},
		{
			code: `a  a {}`,
			description: `combinator selector contain multiple spaces`,
		},
		{
			code: `a\na {}`,
			description: `combinator selector contain newline`,
		},
		{
			code: `a\r\na {}`,
			description: `combinator selector contain CRLF`,
		},
		{
			code: `a\n\na {}`,
			description: `combinator selector contain multiple newline`,
		},
		{
			code: `a\r\n\r\na {}`,
			description: `combinator selector contain multiple CRLF`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `custom property in root`,
		},
		{
			code: `html { --foo: 1px; }`,
			description: `custom property in selector`,
		},
		{
			code: `:root { --custom-property-set: {} }`,
			description: `custom property set in root`,
		},
		{
			code: `html { --custom-property-set: {} }`,
			description: `custom property set in selector`,
		},
		{
			code: `a[b=#{c}] { }`,
			description: `ignore "invalid" selector (see #3130)`,
		},
		{
			code: `namespace|type#id > .foo {}`,
			description: `qualified ID with namespace`,
		},
		{
			code: `namespace|type#id > .foo {}, space|customtype#id_withunder > a {}`,
			description: `qualified ID with namespace selector list`,
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
			description: `two spaces before + combinator`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 4,
		},
		{
			code: `a\n+ a {}`,
			fixed: `a + a {}`,
			description: `newline before + combinator`,
			message: messages.expectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n+ a {}`,
			fixed: `a + a {}`,
			description: `CRLF before + combinator`,
			message: messages.expectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a+a {}`,
			fixed: `a +a {}`,
			description: `no space before + combinator`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 2,
		},
		{
			code: `a>a {}`,
			fixed: `a >a {}`,
			description: `no space before > combinator`,
			message: messages.expectedBefore(`>`),
			line: 1,
			column: 2,
		},
		{
			code: `a~a {}`,
			fixed: `a ~a {}`,
			description: `no space before ~ combinator`,
			message: messages.expectedBefore(`~`),
			line: 1,
			column: 2,
		},
		{
			code: `a + .foo.bar~ a {}`,
			fixed: `a + .foo.bar ~ a {}`,
			description: `multiple combinators: no space before ~ combinator`,
			message: messages.expectedBefore(`~`),
			line: 1,
			column: 13,
		},
		{
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo + .foo.bar ~ a {}`,
			description: `multiple combinators: no space before + combinator`,
			message: messages.expectedBefore(`+`),
			line: 1,
			column: 5,
		},
		{
			code: `a>>> a {}`,
			fixed: `a >>> a {}`,
			description: `shadow-piercing descendant combinator`,
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
			description: `no space before one after + combinator`,
		},
		{
			code: `a> a {}`,
			description: `no space before one after > combinator`,
		},
		{
			code: `a~ a {}`,
			description: `no space before one after ~ combinator`,
		},
		{
			code: `a>>> a {}`,
			description: `shadow-piercing descendant combinator`,
		},
		{
			code: `.foo~ a+ bar {}`,
			description: `multiple combinators with no space after`,
		},
		{
			code: `a+a {}`,
			description: `no space before or after + combinator`,
		},
		{
			code: `a>a {}`,
			description: `no space before or after > combinator`,
		},
		{
			code: `a~a {}`,
			description: `no space before or after ~ combinator`,
		},
		{
			code: `a+\na {}`,
			description: `no space before and newline after + combinator`,
		},
		{
			code: `a>\na {}`,
			description: `no space before and newline after > combinator`,
		},
		{
			code: `a>\r\na {}`,
			description: `no space before and CRLF after > combinator`,
		},
		{
			code: `a~\na {}`,
			description: `no space before and newline after ~ combinator`,
		},
		{
			code: `a>>>\na {}`,
			description: `no space before and newline after >>> combinator`,
		},
		{
			code: `a>>>\r\na {}`,
			description: `no space before and CRLF after >>> combinator`,
		},
		{
			code: `.foo:nth-child(2n + 1) {}`,
			description: `spaced + in nth-child argument`,
		},
		{
			code: `.foo:nth-child(2n - 1) {}`,
			description: `spaced - in nth-child argument`,
		},
		{
			code: `a[rel~='copyright'] {}`,
			description: `attribute selector with ~=`,
		},
		{
			code: `a [type='button'] {}`,
			description: `combinator between selectors and attribute selector`,
		},
		{
			code: `a  a {}`,
			description: `combinator selector contain multiple spaces`,
		},
		{
			code: `a\na {}`,
			description: `combinator selector contain newline`,
		},
		{
			code: `a\r\na {}`,
			description: `combinator selector contain CRLF`,
		},
		{
			code: `a\n\na {}`,
			description: `combinator selector contain multiple newline`,
		},
		{
			code: `a\r\n\r\na {}`,
			description: `combinator selector contain multiple CRLF`,
		},
		{
			code: `namespace|type#id> .foo {}`,
			description: `qualified ID with namespace`,
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
			description: `space before + combinator`,
			message: messages.rejectedBefore(`+`),
			line: 1,
			column: 3,
		},
		{
			code: `a >a {}`,
			fixed: `a>a {}`,
			description: `space before > combinator`,
			message: messages.rejectedBefore(`>`),
			line: 1,
			column: 3,
		},
		{
			code: `a ~a {}`,
			fixed: `a~a {}`,
			description: `space before ~ combinator`,
			message: messages.rejectedBefore(`~`),
			line: 1,
			column: 3,
		},
		{
			code: `a\n+a {}`,
			fixed: `a+a {}`,
			description: `newline before + combinator`,
			message: messages.rejectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n+a {}`,
			fixed: `a+a {}`,
			description: `CRLF before + combinator`,
			message: messages.rejectedBefore(`+`),
			line: 2,
			column: 1,
		},
		{
			code: `a\n>a {}`,
			fixed: `a>a {}`,
			description: `newline before > combinator`,
			message: messages.rejectedBefore(`>`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n>a {}`,
			fixed: `a>a {}`,
			description: `CRLF before > combinator`,
			message: messages.rejectedBefore(`>`),
			line: 2,
			column: 1,
		},
		{
			code: `a\n~a {}`,
			fixed: `a~a {}`,
			description: `newline before ~ combinator`,
			message: messages.rejectedBefore(`~`),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n~a {}`,
			fixed: `a~a {}`,
			description: `CRLF before ~ combinator`,
			message: messages.rejectedBefore(`~`),
			line: 2,
			column: 1,
		},
		{
			code: `a + .foo.bar~ a {}`,
			fixed: `a+ .foo.bar~ a {}`,
			description: `multiple combinators: space before + combinator`,
			message: messages.rejectedBefore(`+`),
			line: 1,
			column: 3,
		},
		{
			code: `#foo+ .foo.bar ~ a {}`,
			fixed: `#foo+ .foo.bar~ a {}`,
			description: `multiple combinators: no space before ~ combinator`,
			message: messages.rejectedBefore(`~`),
			line: 1,
			column: 16,
		},
		{
			code: `a >>> a {}`,
			fixed: `a>>> a {}`,
			description: `space before >>> combinator`,
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
			description: `ignore constructs`,
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
			description: `two spaces before + combinator`,
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
			description: `scss nesting`,
		},
		{
			code: `a {> a,> .b {}}`,
			description: `scss nesting`,
		},
		{
			code: `a {> /*comment*/ a,> /*comment*/ .b {}}`,
			description: `scss nesting, comment and comma`,
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
			description: `scss nesting, comment and comma`,
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
			description: `scss nesting`,
		},
		{
			code: `a { > a, > .b {}}`,
			description: `scss nesting`,
		},
		{
			code: `a { > /*comment*/ a, > /*commenttest*/ .b {}}`,
			description: `scss nesting, comment and comma`,
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
			description: `scss nesting, comment and comma`,
			message: messages.rejectedBefore(`>`),
			line: 1,
			column: 39,
		},
	],
})
