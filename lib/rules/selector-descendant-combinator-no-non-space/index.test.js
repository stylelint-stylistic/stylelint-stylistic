import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: `.foo.bar {}`,
		},
		{
			code: `.foo .bar {}`,
		},
		{
			code: `.foo>.bar {}`,
		},
		{
			code: `.foo > .bar {}`,
		},
		{
			code: `.foo  >  .bar {}`,
		},
		{
			code: `.foo\n>\n.bar {}`,
		},
		{
			code: `.foo\r\n>\r\n.bar {}`,
		},
		{
			code: `.foo >>> .bar {}`,
			description: `shadow-piercing descendant combinator`,
		},
		{
			code: `.foo  >>>  .bar {}`,
			description: `shadow-piercing descendant combinator`,
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
			code: `div > :nth-child(2n + 1) {}`,
		},
		{
			code: `.foo  /*comment*/  >  .bar {}`,
		},
		{
			code: `.foo >\n/*comment*/\n.bar {}`,
		},
		{
			code: `.foo /*c*/ /*c*/ > /*c*/ /*c*/ .bar {}`,
		},
		{
			code: `
      button,
      html [type="button"], /* 1 */
      [type="reset"],
      [type="submit"] {
        -webkit-appearance: button; /* 2 */
      }
      `,
		},
		{
			code: `a[b=#{c}] { }`,
			description: `ignore "invalid" selector (see #3130)`,
		},
		// Tests for workaround for parser incompatibility
		{
			code: `.foo >    /*comment*/    .bar {}`,
		},
		{
			code: `.foo >\n/**/\n.bar {}`,
		},
		{
			code: `.foo /*comment*/ .bar {}`,
			description: `a comment inside a descendant combinator, every run beside it a single space`,
		},
		{
			code: `.foo /*comment*/.bar {}`,
			description: `a comment abutting the selector after it`,
		},
		{
			code: `.foo/*comment*/ .bar {}`,
			description: `a comment abutting the selector before it`,
		},
		{
			code: `.foo /*a*//*b*/ .bar {}`,
			description: `two comments abutting each other`,
		},
	],

	reject: [
		{
			code: `.foo  .bar {}`,
			fixed: `.foo .bar {}`,
			message: messages.rejected(`  `),
			line: 1,
			column: 5,
		},
		{
			code: `.foo\t.bar {}`,
			fixed: `.foo .bar {}`,
			message: messages.rejected(`\t`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo\n.bar {}`,
			fixed: `.foo .bar {}`,
			message: messages.rejected(`\n`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo\r\n.bar {}`,
			fixed: `.foo .bar {}`,
			message: messages.rejected(`\r\n`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo /*comment*/  /*comment*/ .bar > /*comment*/   .buz {}`,
			fixed: `.foo /*comment*/ /*comment*/ .bar > /*comment*/   .buz {}`,
			description: `the whitespace between two comments of a descendant combinator, the child combinator further along being none of this rule's business`,
			message: messages.rejected(`  `),
			line: 1,
			column: 17,
		},
		{
			code: `.foo  /*comment*/  .bar {}`,
			fixed: `.foo /*comment*/ .bar {}`,
			description: `a run on either side of a comment`,
			warnings: [
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 18,
				},
			],
		},
		{
			code: `.foo\n/*comment*/\n.bar {}`,
			fixed: `.foo /*comment*/ .bar {}`,
			description: `a comment on a line of its own`,
			warnings: [
				{
					message: messages.rejected(`\n`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\n`),
					line: 2,
					column: 12,
				},
			],
		},
		{
			code: `.foo  /*comment*/.bar {}`,
			fixed: `.foo /*comment*/.bar {}`,
			description: `a comment abutting the selector after it`,
			message: messages.rejected(`  `),
			line: 1,
			column: 5,
		},
		{
			code: `.foo/*comment*/  .bar {}`,
			fixed: `.foo/*comment*/ .bar {}`,
			description: `a comment abutting the selector before it`,
			message: messages.rejected(`  `),
			line: 1,
			column: 16,
		},
		{
			code: `.foo  .bar, .baz /*comment*/ .qux {}`,
			fixed: `.foo .bar, .baz /*comment*/ .qux {}`,
			description: `a comment in one selector of a list, the other still being read`,
			message: messages.rejected(`  `),
			line: 1,
			column: 5,
		},
		{
			code: `.foo /*comment*/ (  ) .bar {}`,
			fixed: `.foo /*comment*/ (  ) .bar {}`,
			description: `an illegal combinator carrying a comment, which the fixer has to leave standing`,
			message: messages.rejected(` /*comment*/ (  )`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo (  ) .bar {}`,
			fixed: `.foo (  ) .bar {}`,
			description: `illegal combinator, which the fixer has to leave standing`,
			message: messages.rejected(` (  )`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo ( ) .bar {}`,
			fixed: `.foo ( ) .bar {}`,
			description: `illegal combinator holding no surplus whitespace of its own`,
			message: messages.rejected(` ( )`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo () .bar {}`,
			fixed: `.foo () .bar {}`,
			description: `illegal combinator holding no whitespace of its own`,
			message: messages.rejected(` ()`),
			line: 1,
			column: 5,
		},
		{
			code: `.foo /*comment*/\t( )\t.bar {}`,
			fixed: `.foo /*comment*/\t( ) .bar {}`,
			description: `a comment the parser files behind the parenthesised group in front of it, given back the place the file gives it`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\t( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\t`),
					line: 1,
					column: 21,
				},
			],
		},
		{
			code: `.foo /*comment*/\n( )\n.bar {}`,
			fixed: `.foo /*comment*/\n( ) .bar {}`,
			description: `the same, broken over lines`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\n( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\n`),
					line: 2,
					column: 4,
				},
			],
		},
		{
			code: `.baz /*comment*/\t( )\t.qux, .foo  .bar {}`,
			fixed: `.baz /*comment*/\t( ) .qux, .foo .bar {}`,
			description: `the same in one selector of a list, the other being read as it always was`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\t( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\t`),
					line: 1,
					column: 21,
				},
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 32,
				},
			],
		},
		{
			code: `a:not(.b /*comment*/\t( )\t.c) {}`,
			fixed: `a:not(.b /*comment*/\t( ) .c) {}`,
			description: `the same inside a pseudo-class's argument`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\t( )`),
					line: 1,
					column: 9,
				},
				{
					message: messages.rejected(`\t`),
					line: 1,
					column: 25,
				},
			],
		},
		{
			code: `.foo  /*comment*/\t( )\t.bar {}`,
			fixed: `.foo  /*comment*/\t( ) .bar {}`,
			description: `the same with more whitespace in front of the comment, which the parser reads the same way as long as it opens with a space`,
			warnings: [
				{
					message: messages.rejected(`  /*comment*/\t( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\t`),
					line: 1,
					column: 22,
				},
			],
		},
		{
			code: `.foo /*comment*/\r\n( )\r\n.bar {}`,
			fixed: `.foo /*comment*/\r\n( ) .bar {}`,
			description: `CRLF`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\r\n( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\r\n`),
					line: 2,
					column: 4,
				},
			],
		},
		{
			code: `.foo /*comment*/\t( ) ( )\t.bar {}`,
			fixed: `.foo /*comment*/\t( ) ( ) .bar {}`,
			description: `two such groups, only the whitespace standing outside both of them being fixable`,
			warnings: [
				{
					message: messages.rejected(` /*comment*/\t( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(` ( )`),
					line: 1,
					column: 21,
				},
				{
					message: messages.rejected(`\t`),
					line: 1,
					column: 25,
				},
			],
		},
		{
			code: `.foo (  )  .bar {}`,
			fixed: `.foo (  ) .bar {}`,
			description: `surplus whitespace after an illegal combinator, which is a descendant combinator of its own`,
			warnings: [
				{
					message: messages.rejected(` (  )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 10,
				},
			],
		},
		{
			code: `.foo ()  ()  .bar {}`,
			fixed: `.foo ()  () .bar {}`,
			description: `two illegal combinators, only the whitespace standing outside both of them being fixable`,
			warnings: [
				{
					message: messages.rejected(` ()`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`  ()`),
					line: 1,
					column: 8,
				},
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 12,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `div > :nth-child(#{$i + ($column - 1)}) {}`,
		},
		{
			code: `.foo // comment\n.bar {}`,
			description: `a selector carrying an inline comment, whose one run is a single space`,
		},
		{
			code: `.foo // comment\n\t\t.bar {}`,
			description: `the break that closes an inline comment, which a single space could not close`,
		},
	],

	reject: [
		{
			code: `.foo // comment\n( )\n.bar {}`,
			fixed: `.foo // comment\n( ) .bar {}`,
			description: `a parenthesised group the parser carries an inline comment across, the warning naming the selector the way the file spells it`,
			warnings: [
				{
					message: messages.rejected(` // comment\n( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\n`),
					line: 2,
					column: 4,
				},
			],
		},
		{
			code: `.foo\t// comment\n( )\t.bar {}`,
			fixed: `.foo\t// comment\n( ) .bar {}`,
			description: `the same where the parser carries the comment nowhere, the warning having named the comment as the rule reads it rather than as the file spells it`,
			warnings: [
				{
					message: messages.rejected(`\t// comment\n( )`),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`\t`),
					line: 2,
					column: 4,
				},
			],
		},
		{
			code: `.foo  // comment\n  .bar {}`,
			fixed: `.foo // comment\n  .bar {}`,
			description: `a run standing in front of an inline comment, reported where the source spells it rather than where the raw does`,
			message: messages.rejected(`  `),
			line: 1,
			column: 5,
		},
		{
			code: `.foo[x="/*"]  // comment\n  .bar {}`,
			fixed: `.foo[x="/*"] // comment\n  .bar {}`,
			description: `an attribute value spelling the opening of a comment, which opens none`,
			message: messages.rejected(`  `),
			line: 1,
			column: 13,
		},
		{
			code: `.foo  // comment\n  .bar, .baz  .qux {}`,
			fixed: `.foo // comment\n  .bar, .baz .qux {}`,
			description: `the same, beside a selector of the list that carries no comment at all`,
			warnings: [
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`  `),
					line: 2,
					column: 13,
				},
			],
		},
		{
			code: `.foo  /* comment */  .bar {}`,
			fixed: `.foo /* comment */ .bar {}`,
			description: `a block comment under this syntax is read as it is under any other`,
			warnings: [
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 5,
				},
				{
					message: messages.rejected(`  `),
					line: 1,
					column: 20,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `:hover when (@variable = true) { color: red; }`,
		},
		{
			code: `a:hover when (@variable = true) { color: red; }`,
		},
		{
			code: `.a:hover when (1 = 1) { color: red; }`,
			description: `a guard naming no variable, on a selector carrying a colon`,
		},
		{
			code: `.a:hover when not (1 = 1) { color: red; }`,
			description: `a negated guard naming no variable`,
		},
		{
			code: `.a::before when (default()) { color: red; }`,
			description: `a guard calling a function`,
		},
		{
			code: `.a:hover when(1 = 1) { color: red; }`,
			description: `a guard written with no space in front of its condition, which Less takes as readily`,
		},
		{
			code: `.a:hover when not(1 = 1) { color: red; }`,
			description: `the same, negated`,
		},
		{
			code: String.raw`.x\'y:hover when ('z' = 'w') { color: red; }`,
			description: `a guard on a class name carrying an escaped quote, which opens no string`,
		},
	],
})
