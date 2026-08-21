import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a, b {}`,
			description: `a space after the comma`,
		},
		{
			code: `a, b, c {}`,
			description: `a space after each of the two commas`,
		},
		{
			code: `a , b {}`,
			description: `a space on either side of the comma`,
		},
		{
			code: `a\n, b {}`,
			description: `a newline in front of the comma and a space after it`,
		},
		{
			code: `a\r\n, b {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a, b[data-foo="tr,tr"] {}`,
			description: `a comma inside an attribute value, which is no comma of the list`,
		},
		{
			code: `a:matches(:hover,:focus) {}`,
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
		},
		{
			code: `:not(:hover,:focus) {}`,
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
			code: `a/*comment,comment*/, /*comment*/b {}`,
			description: `a comma standing behind a comment, the space in front of another`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a, b {}`,
			description: `no space after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,  b {}`,
			fixed: `a, b {}`,
			description: `two spaces after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\nb {}`,
			fixed: `a, b {}`,
			description: `a newline after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\r\nb {}`,
			fixed: `a, b {}`,
			description: `a carriage-return line break after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\tb {}`,
			fixed: `a, b {}`,
			description: `a tab after the comma`,
			message: messages.expectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a, b,c {}`,
			fixed: `a, b, c {}`,
			description: `no space after the second of two commas`,
			message: messages.expectedAfter(),
			line: 1,
			column: 5,
		},
		{
			code: `a, b,  c {}`,
			fixed: `a, b, c {}`,
			description: `two spaces after the second of two commas`,
			message: messages.expectedAfter(),
			line: 1,
			column: 5,
		},
		{
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/, /*comment*/b {}`,
			description: `no space after a comma standing between two comments`,
			message: messages.expectedAfter(),
			line: 1,
			column: 13,
		},
		{
			code: `a,b,c {}`,
			fixed: `a, b, c {}`,
			description: `no space after either of the two commas`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 2,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 4,
				},
			],
		},
		{
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a, b, c, d, e, f, g {}`,
			description: `no space after any of the six commas`,
			warnings: [
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 2,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 4,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 6,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 8,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 10,
				},
				{
					message: messages.expectedAfter(),
					line: 1,
					column: 12,
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
			code: `a,b {}`,
			description: `no space after the comma`,
		},
		{
			code: `a,b,c {}`,
			description: `no space after either of the two commas`,
		},
		{
			code: `a ,b {}`,
			description: `a space in front of the comma and none after it`,
		},
		{
			code: `a\n,b {}`,
			description: `a newline in front of the comma and nothing after it`,
		},
		{
			code: `a\r\n,b {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a,b[data-foo="tr, tr"] {}`,
			description: `a comma and a space inside an attribute value, which are no commas of the list`,
		},
		{
			code: `a:matches(:hover, :focus) {}`,
			description: `spaced commas inside the argument of a pseudo-class`,
		},
		{
			code: `:not(:hover, :focus) {}`,
			description: `the same inside a negation`,
		},
		{
			code: `a/*comment, comment*/,/*comment*/b {}`,
			description: `comments on either side of the comma, with no space anywhere`,
		},
	],

	reject: [
		{
			code: `a, b {}`,
			fixed: `a,b {}`,
			description: `a space after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,  b {}`,
			fixed: `a,b {}`,
			description: `two spaces after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\nb {}`,
			fixed: `a,b {}`,
			description: `a newline after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\r\nb {}`,
			fixed: `a,b {}`,
			description: `a carriage-return line break after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,\tb {}`,
			fixed: `a,b {}`,
			description: `a tab after the comma`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b, c {}`,
			fixed: `a,b,c {}`,
			description: `a space after the second of two commas`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a,b,  c {}`,
			fixed: `a,b,c {}`,
			description: `two spaces after the second of two commas`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 4,
		},
		{
			code: `a/*comment*/, /*comment*/b {}`,
			fixed: `a/*comment*/,/*comment*/b {}`,
			description: `a space after a comma standing between two comments`,
			message: messages.rejectedAfter(),
			line: 1,
			column: 13,
		},
		{
			code: `a, b, c {}`,
			fixed: `a,b,c {}`,
			description: `a space after either of the two commas`,
			warnings: [
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 2,
				},
				{
					message: messages.rejectedAfter(),
					line: 1,
					column: 5,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a, b {}`,
			description: `a space after the comma of a single-line list`,
		},
		{
			code: `a, b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a, b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a, b {}`,
			description: `no space after the comma of a single-line list`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b {\n}`,
			fixed: `a, b {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b {\r\n}`,
			fixed: `a, b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.expectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a,b {}`,
			description: `no space after the comma of a single-line list`,
		},
		{
			code: `a,b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
	],

	reject: [
		{
			code: `a, b {}`,
			fixed: `a,b {}`,
			description: `a space after the comma of a single-line list`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a, b {\n}`,
			fixed: `a,b {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a, b {\r\n}`,
			fixed: `a,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.rejectedAfterSingleLine(),
			line: 1,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `.col( @a,@b ) {}`,
			description: `a Less mixin whose parameters carry commas of their own`,
		},
		{
			code: `.col3( @a,@b ) {}`,
			description: `the same mixin, its name ending in a digit`,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			code: `.a // c\n.b,.c {}`,
			fixed: `.a // c\n.b, .c {}`,
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			message: messages.expectedAfter(),
			line: 2,
			column: 3,
		},
	],
})
