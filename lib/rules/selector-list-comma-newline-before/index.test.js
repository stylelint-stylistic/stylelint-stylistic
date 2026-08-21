import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a\n,b {}`,
			description: `a newline in front of the comma`,
		},
		{
			code: `a\n\n,b {}`,
			description: `two newlines in front of the comma`,
		},
		{
			code: `a\n,b\n,c {}`,
			description: `a newline in front of each of the two commas`,
		},
		{
			code: `a\r\n,b\r\n,c {}`,
			description: `the same list written with carriage-return line breaks`,
		},
		{
			code: `a\r\n\r\n,b\r\n,c {}`,
			description: `two carriage-return line breaks in front of the first comma`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/196
			code: `a\r,b {}`,
			description: `a bare carriage return, which ends a line as readily — the fix used to write a line feed in front of it and grow the file by a line with every run`,
		},
		{
			code: `a\f,b {}`,
			description: `a form feed, which ends a line to every syntax this plugin reads through`,
		},
		{
			code: `a\r  ,b {}`,
			description: `indentation behind a bare carriage return`,
		},
		{
			code: `a\n, b {}`,
			description: `a newline in front of the comma and a space after it`,
		},
		{
			code: `a\n,\nb {}`,
			description: `a newline on either side of the comma`,
		},
		{
			code: `a\r\n,\r\nb {}`,
			description: `the same list written with carriage-return line breaks`,
		},
		{
			code: `a\n,b[data-foo="tr,tr"] {}`,
			description: `a comma inside an attribute value, which is no comma of the list`,
		},
		{
			code: `a\n    ,b {}`,
			description: `spaces of indentation in front of the comma`,
		},
		{
			code: `a\r\n    ,b {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a\n\t\t,b {}`,
			description: `tabs of indentation in front of the comma`,
		},
		{
			autoStripIndent: false,
			code: `\ta\n\t, b {}`,
			description: `an indented selector list`,
		},
		{
			code: `a:matches(:hover, :focus) {}`,
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
		},
		{
			code: `:not(:hover, :focus) {}`,
			description: `the same inside a negation`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `a custom property under the root selector`,
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
			code: `a/*comment,comment*/\n,/*comment*/b {}`,
			description: `a comma standing behind a comment and a newline, with another comment after it`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a\n,b {}`,
			description: `no newline in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a ,b {}`,
			fixed: `a\n ,b {}`,
			description: `a space in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a  ,b {}`,
			fixed: `a\n  ,b {}`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 4,
		},
		{
			code: `a\t,b {}`,
			fixed: `a\n\t,b {}`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a\n,b,c {}`,
			fixed: `a\n,b\n,c {}`,
			description: `no newline in front of the second of two commas`,
			message: messages.expectedBefore(),
			line: 2,
			column: 3,
		},
		{
			code: `a\r\n,b,c {}`,
			fixed: `a\r\n,b\r\n,c {}`,
			description: `the same list written with a carriage-return line break`,
			message: messages.expectedBefore(),
			line: 2,
			column: 3,
		},
		{
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/\n,/*comment*/b {}`,
			description: `no newline in front of a comma standing between two comments`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a\n,b\n,c\n,d\n,e\n,f\n,g {}`,
			description: `no newline in front of any of the six commas`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 2,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 4,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 6,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 8,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 10,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 12,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a\n,b {}`,
			description: `a newline in front of the comma of a multi-line list`,
		},
		{
			code: `a\r\n,b {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a, b {}`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a, b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `\ta\n\t, b {\n}`,
			description: `an indented multi-line list`,
		},
	],

	reject: [
		{
			code: `a\n,b, c {}`,
			fixed: `a\n,b\n, c {}`,
			description: `no newline in front of the second comma of a multi-line list`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
		{
			code: `a\r\n,b, c {}`,
			fixed: `a\r\n,b\r\n, c {}`,
			description: `the same list written with a carriage-return line break`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
		{
			code: `a\n,b, c {\n}`,
			fixed: `a\n,b\n, c {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a,\nb {}`,
			description: `a newline after the comma, which leaves nothing in front of it`,
		},
		{
			code: `a ,b {}`,
			description: `a single-line list, which this option does not measure`,
		},
		{
			code: `a ,b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a ,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
		{
			code: `a:matches(:hover, :focus) {}`,
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
		},
		{
			code: `:not(:hover, :focus) {}`,
			description: `the same inside a negation`,
		},
		{
			code: `a/*comment\n,comment*/,/*comment*/b {\n}`,
			description: `a newline inside the text of a comment, which the comma does not stand behind`,
		},
	],

	reject: [
		{
			code: `a,\nb , c {}`,
			fixed: `a,\nb, c {}`,
			description: `a space in front of the second comma of a multi-line list`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
		{
			code: `
				a,
				b , c {
				}
			`,
			fixed: `
				a,
				b, c {
				}
			`,
			description: `the same list in front of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
		{
			code: `a,\r\nb , c {\r\n}`,
			fixed: `a,\r\nb, c {\r\n}`,
			description: `the same list and block written with carriage-return line breaks`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 3,
		},
		{
			code: `
				a/*comment*/
				,/*comment*/b {
				}
			`,
			fixed: `
				a/*comment*/,/*comment*/b {
				}
			`,
			description: `a newline in front of a comma standing between two comments`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			code: `.a // c\n.b\n, .c {}`,
			fixed: `.a // c\n.b, .c {}`,
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			message: messages.rejectedBeforeMultiLine(),
			line: 3,
			column: 1,
		},
		{
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 1,
		},
	],
})
