import { createRule } from "../../../../rules/selector-descendant-combinator-no-non-space/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

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
