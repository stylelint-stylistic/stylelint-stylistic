import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `two classes with no combinator between them`,
			code: `.foo.bar {}`,
		},
		{
			description: `a single space standing for the descendant combinator`,
			code: `.foo .bar {}`,
		},
		{
			description: `a child combinator with no space around it`,
			code: `.foo>.bar {}`,
		},
		{
			description: `a child combinator with a space on either side`,
			code: `.foo > .bar {}`,
		},
		{
			description: `two spaces on either side of a child combinator, which this rule leaves to the combinator rules`,
			code: `.foo  >  .bar {}`,
		},
		{
			description: `newlines on either side of a child combinator`,
			code: `.foo\n>\n.bar {}`,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `.foo\r\n>\r\n.bar {}`,
		},
		{
			description: `a shadow-piercing descendant combinator with a space on either side`,
			code: `.foo >>> .bar {}`,
		},
		{
			description: `the same behind two spaces on either side`,
			code: `.foo  >>>  .bar {}`,
		},
		{
			description: `a custom property under the root selector`,
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
			description: `a child combinator in front of a pseudo-class taking a formula`,
			code: `div > :nth-child(2n + 1) {}`,
		},
		{
			description: `runs of spaces around a comment beside a child combinator`,
			code: `.foo  /*comment*/  >  .bar {}`,
		},
		{
			description: `a comment standing on its own line beside a child combinator`,
			code: `
				.foo >
				/*comment*/
				.bar {}
			`,
		},
		{
			description: `four comments standing around a child combinator`,
			code: `.foo /*c*/ /*c*/ > /*c*/ /*c*/ .bar {}`,
		},
		{
			description: `a selector list broken over lines, one selector carrying a comment behind it`,
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
			description: `an attribute selector the parser cannot read`,
			code: `a[b=#{c}] { }`,
		},
		// Tests for workaround for parser incompatibility
		{
			description: `longer runs of spaces around a comment beside a child combinator`,
			code: `.foo >    /*comment*/    .bar {}`,
		},
		{
			description: `an empty comment standing on its own line beside a child combinator`,
			code: `
				.foo >
				/**/
				.bar {}
			`,
		},
		{
			description: `a comment inside a descendant combinator, every run beside it a single space`,
			code: `.foo /*comment*/ .bar {}`,
		},
		{
			description: `a comment abutting the selector after it`,
			code: `.foo /*comment*/.bar {}`,
		},
		{
			description: `a comment abutting the selector before it`,
			code: `.foo/*comment*/ .bar {}`,
		},
		{
			description: `two comments abutting each other`,
			code: `.foo /*a*//*b*/ .bar {}`,
		},
	],

	reject: [
		{
			description: `two spaces standing for the descendant combinator`,
			code: `.foo  .bar {}`,
			fixed: `.foo .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`  `),
		},
		{
			description: `a tab standing for the descendant combinator`,
			code: `.foo\t.bar {}`,
			fixed: `.foo .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`\t`),
		},
		{
			description: `a newline standing for the descendant combinator`,
			code: `.foo\n.bar {}`,
			fixed: `.foo .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`\n`),
		},
		{
			description: `a carriage-return line break standing for the descendant combinator`,
			code: `.foo\r\n.bar {}`,
			fixed: `.foo .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`\r\n`),
		},
		{
			description: `the whitespace between two comments of a descendant combinator, the child combinator further along being none of this rule's business`,
			code: `.foo /*comment*/  /*comment*/ .bar > /*comment*/   .buz {}`,
			fixed: `.foo /*comment*/ /*comment*/ .bar > /*comment*/   .buz {}`,
			line: 1,
			column: 17,
			message: messages.rejected(`  `),
		},
		{
			description: `a run on either side of a comment`,
			code: `.foo  /*comment*/  .bar {}`,
			fixed: `.foo /*comment*/ .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`  `),
				},
				{
					line: 1,
					column: 18,
					message: messages.rejected(`  `),
				},
			],
		},
		{
			description: `a comment on a line of its own`,
			code: `
				.foo
				/*comment*/
				.bar {}
			`,
			fixed: `.foo /*comment*/ .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`\n`),
				},
				{
					line: 2,
					column: 12,
					message: messages.rejected(`\n`),
				},
			],
		},
		{
			description: `a comment abutting the selector after it`,
			code: `.foo  /*comment*/.bar {}`,
			fixed: `.foo /*comment*/.bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`  `),
		},
		{
			description: `a comment abutting the selector before it`,
			code: `.foo/*comment*/  .bar {}`,
			fixed: `.foo/*comment*/ .bar {}`,
			line: 1,
			column: 16,
			message: messages.rejected(`  `),
		},
		{
			description: `a comment in one selector of a list, the other still being read`,
			code: `.foo  .bar, .baz /*comment*/ .qux {}`,
			fixed: `.foo .bar, .baz /*comment*/ .qux {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`  `),
		},
		{
			description: `an illegal combinator carrying a comment, which the fixer has to leave standing`,
			code: `.foo /*comment*/ (  ) .bar {}`,
			fixed: `.foo /*comment*/ (  ) .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(` /*comment*/ (  )`),
		},
		{
			description: `illegal combinator, which the fixer has to leave standing`,
			code: `.foo (  ) .bar {}`,
			fixed: `.foo (  ) .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(` (  )`),
		},
		{
			description: `illegal combinator holding no surplus whitespace of its own`,
			code: `.foo ( ) .bar {}`,
			fixed: `.foo ( ) .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(` ( )`),
		},
		{
			description: `illegal combinator holding no whitespace of its own`,
			code: `.foo () .bar {}`,
			fixed: `.foo () .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(` ()`),
		},
		{
			description: `a comment the parser files behind the parenthesised group in front of it, given back the place the file gives it`,
			code: `.foo /*comment*/\t( )\t.bar {}`,
			fixed: `.foo /*comment*/\t( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` /*comment*/\t( )`),
				},
				{
					line: 1,
					column: 21,
					message: messages.rejected(`\t`),
				},
			],
		},
		{
			description: `the same, broken over lines`,
			code: `.foo /*comment*/\n( )\n.bar {}`,
			fixed: `.foo /*comment*/\n( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` /*comment*/\n( )`),
				},
				{
					line: 2,
					column: 4,
					message: messages.rejected(`\n`),
				},
			],
		},
		{
			description: `the same in one selector of a list, the other being read as it always was`,
			code: `.baz /*comment*/\t( )\t.qux, .foo  .bar {}`,
			fixed: `.baz /*comment*/\t( ) .qux, .foo .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` /*comment*/\t( )`),
				},
				{
					line: 1,
					column: 21,
					message: messages.rejected(`\t`),
				},
				{
					line: 1,
					column: 32,
					message: messages.rejected(`  `),
				},
			],
		},
		{
			description: `the same inside a pseudo-class's argument`,
			code: `a:not(.b /*comment*/\t( )\t.c) {}`,
			fixed: `a:not(.b /*comment*/\t( ) .c) {}`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejected(` /*comment*/\t( )`),
				},
				{
					line: 1,
					column: 25,
					message: messages.rejected(`\t`),
				},
			],
		},
		{
			description: `the same with more whitespace in front of the comment, which the parser reads the same way as long as it opens with a space`,
			code: `.foo  /*comment*/\t( )\t.bar {}`,
			fixed: `.foo  /*comment*/\t( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`  /*comment*/\t( )`),
				},
				{
					line: 1,
					column: 22,
					message: messages.rejected(`\t`),
				},
			],
		},
		{
			description: `CRLF`,
			code: `.foo /*comment*/\r\n( )\r\n.bar {}`,
			fixed: `.foo /*comment*/\r\n( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` /*comment*/\r\n( )`),
				},
				{
					line: 2,
					column: 4,
					message: messages.rejected(`\r\n`),
				},
			],
		},
		{
			description: `two such groups, only the whitespace standing outside both of them being fixable`,
			code: `.foo /*comment*/\t( ) ( )\t.bar {}`,
			fixed: `.foo /*comment*/\t( ) ( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` /*comment*/\t( )`),
				},
				{
					line: 1,
					column: 21,
					message: messages.rejected(` ( )`),
				},
				{
					line: 1,
					column: 25,
					message: messages.rejected(`\t`),
				},
			],
		},
		{
			description: `surplus whitespace after an illegal combinator, which is a descendant combinator of its own`,
			code: `.foo (  )  .bar {}`,
			fixed: `.foo (  ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` (  )`),
				},
				{
					line: 1,
					column: 10,
					message: messages.rejected(`  `),
				},
			],
		},
		{
			description: `two illegal combinators, only the whitespace standing outside both of them being fixable`,
			code: `.foo ()  ()  .bar {}`,
			fixed: `.foo ()  () .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` ()`),
				},
				{
					line: 1,
					column: 8,
					message: messages.rejected(`  ()`),
				},
				{
					line: 1,
					column: 12,
					message: messages.rejected(`  `),
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
			description: `a child combinator in front of a pseudo-class whose argument is an interpolation`,
			code: `div > :nth-child(#{$i + ($column - 1)}) {}`,
		},
		{
			description: `a selector carrying an inline comment, whose one run is a single space`,
			code: `.foo // comment\n.bar {}`,
		},
		{
			description: `the break that closes an inline comment, which a single space could not close`,
			code: `.foo // comment\n\t\t.bar {}`,
		},
	],

	reject: [
		{
			description: `a parenthesised group the parser carries an inline comment across, the warning naming the selector the way the file spells it`,
			code: `.foo // comment\n( )\n.bar {}`,
			fixed: `.foo // comment\n( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(` // comment\n( )`),
				},
				{
					line: 2,
					column: 4,
					message: messages.rejected(`\n`),
				},
			],
		},
		{
			description: `the same where the parser carries the comment nowhere, the warning having named the comment as the rule reads it rather than as the file spells it`,
			code: `.foo\t// comment\n( )\t.bar {}`,
			fixed: `.foo\t// comment\n( ) .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`\t// comment\n( )`),
				},
				{
					line: 2,
					column: 4,
					message: messages.rejected(`\t`),
				},
			],
		},
		{
			description: `a run standing in front of an inline comment, reported where the source spells it rather than where the raw does`,
			code: `.foo  // comment\n  .bar {}`,
			fixed: `.foo // comment\n  .bar {}`,
			line: 1,
			column: 5,
			message: messages.rejected(`  `),
		},
		{
			description: `an attribute value spelling the opening of a comment, which opens none`,
			code: `.foo[x="/*"]  // comment\n  .bar {}`,
			fixed: `.foo[x="/*"] // comment\n  .bar {}`,
			line: 1,
			column: 13,
			message: messages.rejected(`  `),
		},
		{
			description: `the same, beside a selector of the list that carries no comment at all`,
			code: `.foo  // comment\n  .bar, .baz  .qux {}`,
			fixed: `.foo // comment\n  .bar, .baz .qux {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`  `),
				},
				{
					line: 2,
					column: 13,
					message: messages.rejected(`  `),
				},
			],
		},
		{
			description: `a block comment under this syntax is read as it is under any other`,
			code: `.foo  /* comment */  .bar {}`,
			fixed: `.foo /* comment */ .bar {}`,
			warnings: [
				{
					line: 1,
					column: 5,
					message: messages.rejected(`  `),
				},
				{
					line: 1,
					column: 20,
					message: messages.rejected(`  `),
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
			description: `a Less guard behind a pseudo-class`,
			code: `:hover when (@variable = true) { color: red; }`,
		},
		{
			description: `the same guard behind a type selector and a pseudo-class`,
			code: `a:hover when (@variable = true) { color: red; }`,
		},
		{
			description: `a guard naming no variable, on a selector carrying a colon`,
			code: `.a:hover when (1 = 1) { color: red; }`,
		},
		{
			description: `a negated guard naming no variable`,
			code: `.a:hover when not (1 = 1) { color: red; }`,
		},
		{
			description: `a guard calling a function`,
			code: `.a::before when (default()) { color: red; }`,
		},
		{
			description: `a guard written with no space in front of its condition, which Less takes as readily`,
			code: `.a:hover when(1 = 1) { color: red; }`,
		},
		{
			description: `the same, negated`,
			code: `.a:hover when not(1 = 1) { color: red; }`,
		},
		{
			description: `a guard on a class name carrying an escaped quote, which opens no string`,
			code: String.raw`.x\'y:hover when ('z' = 'w') { color: red; }`,
		},
	],
})
