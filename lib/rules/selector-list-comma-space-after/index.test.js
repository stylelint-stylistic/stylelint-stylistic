import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space after the comma`,
			code: `a, b {}`,
		},
		{
			description: `a space after each of the two commas`,
			code: `a, b, c {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `a , b {}`,
		},
		{
			description: `a newline in front of the comma and a space after it`,
			code: `a\n, b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n, b {}`,
		},
		{
			description: `a comma inside an attribute value, which is no comma of the list`,
			code: `a, b[data-foo="tr,tr"] {}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover,:focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover,:focus) {}`,
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
			description: `a comma standing behind a comment, the space in front of another`,
			code: `a/*comment,comment*/, /*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `no space after the comma`,
			code: `a,b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a,  b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a,\nb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a,\r\nb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a,\tb {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after the second of two commas`,
			code: `a, b,c {}`,
			fixed: `a, b, c {}`,
			line: 1,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `two spaces after the second of two commas`,
			code: `a, b,  c {}`,
			fixed: `a, b, c {}`,
			line: 1,
			column: 5,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after a comma standing between two comments`,
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/, /*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.expectedAfter(),
		},
		{
			description: `no space after either of the two commas`,
			code: `a,b,c {}`,
			fixed: `a, b, c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedAfter(),
				},
			],
		},
		{
			description: `no space after any of the six commas`,
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a, b, c, d, e, f, g {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 6,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 8,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 10,
					message: messages.expectedAfter(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedAfter(),
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
			description: `no space after the comma`,
			code: `a,b {}`,
		},
		{
			description: `no space after either of the two commas`,
			code: `a,b,c {}`,
		},
		{
			description: `a space in front of the comma and none after it`,
			code: `a ,b {}`,
		},
		{
			description: `a newline in front of the comma and nothing after it`,
			code: `a\n,b {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a\r\n,b {}`,
		},
		{
			description: `a comma and a space inside an attribute value, which are no commas of the list`,
			code: `a,b[data-foo="tr, tr"] {}`,
		},
		{
			description: `spaced commas inside the argument of a pseudo-class`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
		},
		{
			description: `comments on either side of the comma, with no space anywhere`,
			code: `a/*comment, comment*/,/*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `a space after the comma`,
			code: `a, b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the comma`,
			code: `a,  b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a newline after the comma`,
			code: `a,\nb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a carriage-return line break after the comma`,
			code: `a,\r\nb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a tab after the comma`,
			code: `a,\tb {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after the second of two commas`,
			code: `a,b, c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `two spaces after the second of two commas`,
			code: `a,b,  c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 4,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after a comma standing between two comments`,
			code: `a/*comment*/, /*comment*/b {}`,
			fixed: `a/*comment*/,/*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space after either of the two commas`,
			code: `a, b, c {}`,
			fixed: `a,b,c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.rejectedAfter(),
				},
				{
					line: 1,
					column: 5,
					message: messages.rejectedAfter(),
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
			description: `a space after the comma of a single-line list`,
			code: `a, b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a, b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a, b {\r\n}`,
		},
	],

	reject: [
		{
			description: `no space after the comma of a single-line list`,
			code: `a,b {}`,
			fixed: `a, b {}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a,b {\n}`,
			fixed: `a, b {\n}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a,b {\r\n}`,
			fixed: `a, b {\r\n}`,
			line: 1,
			column: 2,
			message: messages.expectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space after the comma of a single-line list`,
			code: `a,b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a,b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a,b {\r\n}`,
		},
	],

	reject: [
		{
			description: `a space after the comma of a single-line list`,
			code: `a, b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a, b {\n}`,
			fixed: `a,b {\n}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a, b {\r\n}`,
			fixed: `a,b {\r\n}`,
			line: 1,
			column: 2,
			message: messages.rejectedAfterSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a Less mixin whose parameters carry commas of their own`,
			code: `.col( @a,@b ) {}`,
		},
		{
			description: `the same mixin, its name ending in a digit`,
			code: `.col3( @a,@b ) {}`,
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
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			code: `.a // c\n.b,.c {}`,
			fixed: `.a // c\n.b, .c {}`,
			line: 2,
			column: 3,
			message: messages.expectedAfter(),
		},
	],
})
