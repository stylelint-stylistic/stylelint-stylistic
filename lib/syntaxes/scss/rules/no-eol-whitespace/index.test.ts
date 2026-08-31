import { createRule } from "../../../../rules/no-eol-whitespace/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	accept: [
		{
			autoStripIndent: false,
			description: `an end-of-line comment closed by a newline`,
			code: `// comment 1\n`,
		},
		{
			description: `two end-of-line comments standing in front of a rule`,
			code: `//\n//comment\n  a\n{ color: red\n}`,
		},
		{
			description: `the single space between the slashes and the text of an end-of-line comment, which ends no line`,
			code: `// c\na {}`,
		},
		{
			// The syntax files this comment exactly as it files the whitespace-only inline one below — an empty text, with every character of the whitespace in the raw in front of it — and the only thing telling the two apart is the `raws.inline` that `isStandardSyntaxComment` reads.
			description: `two spaces making up the whole of a block comment under this syntax`,
			code: `/*  */\na {}`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/254
			description: `two spaces making up the whole of an end-of-line comment, which the syntax files where the trim of the comment's end reaches them`,
			code: `//  \nb {}`,
			fixed: `//\nb {}`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same two spaces in front of a carriage-return line break`,
			code: `//  \r\nb {}`,
			fixed: `//\r\nb {}`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same making up the whole of an end-of-line comment a file ends on, with no break behind it`,
			code: `//  `,
			fixed: `//`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same in an end-of-line comment standing behind a declaration rather than at the top level`,
			code: `a {\n\tcolor: red; //  \n}`,
			fixed: `a {\n\tcolor: red; //\n}`,
			warnings: [
				{
					line: 2,
					column: 17,
					message: messages.rejected,
				},
			],
		},
		{
			description: `two spaces at the end of an end-of-line comment`,
			code: `// comment 2  `,
			fixed: `// comment 2`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
			],
		},
		{
			autoStripIndent: false,
			description: `the same spaces in front of a carriage-return line break`,
			code: `// comment 3  \r\n`,
			fixed: `// comment 3\r\n`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
			],
		},
	],
})
testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			description: `trailing whitespace in the text of an inline comment, which the fix trims in the copy the file spells`,
			code: `.a // c \n.b {}`,
			fixed: `.a // c\n.b {}`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
	],
})
