import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a ,b {}`,
			description: `a space in front of the comma`,
		},
		{
			code: `a ,b ,c {}`,
			description: `a space in front of each of the two commas`,
		},
		{
			code: `a , b {}`,
			description: `a space on either side of the comma`,
		},
		{
			code: `a ,\nb {}`,
			description: `a space in front of the comma and a newline after it`,
		},
		{
			code: `a ,\r\nb {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a ,b[data-foo="tr,tr"] {}`,
			description: `a comma inside an attribute value, which is no comma of the list`,
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
			code: `a/*comment,comment*/ ,/*comment*/b {}`,
			description: `a comma standing behind a comment and a space, with another comment after it`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a ,b {}`,
			description: `no space in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 2,
		},
		{
			code: `a  ,b {}`,
			fixed: `a ,b {}`,
			description: `two spaces in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 4,
		},
		{
			code: `a\n,b {}`,
			fixed: `a ,b {}`,
			description: `a newline in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n,b {}`,
			fixed: `a ,b {}`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a\t,b {}`,
			fixed: `a ,b {}`,
			description: `a tab in front of the comma`,
			message: messages.expectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a ,b,c {}`,
			fixed: `a ,b ,c {}`,
			description: `no space in front of the second of two commas`,
			message: messages.expectedBefore(),
			line: 1,
			column: 5,
		},
		{
			code: `a ,b  ,c {}`,
			fixed: `a ,b ,c {}`,
			description: `two spaces in front of the second of two commas`,
			message: messages.expectedBefore(),
			line: 1,
			column: 7,
		},
		{
			code: `a,b,c {}`,
			fixed: `a ,b ,c {}`,
			description: `no space in front of either of the two commas`,
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
			],
		},
		{
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/ ,/*comment*/b {}`,
			description: `no space in front of a comma standing between two comments`,
			message: messages.expectedBefore(),
			line: 1,
			column: 13,
		},
		{
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a ,b ,c ,d ,e ,f ,g {}`,
			description: `no space in front of any of the six commas`,
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
	config: [`never`],

	accept: [
		{
			code: `a,b {}`,
			description: `no space in front of the comma`,
		},
		{
			code: `a,b,c {}`,
			description: `no space in front of either of the two commas`,
		},
		{
			code: `a, b {}`,
			description: `no space in front of the comma and one after it`,
		},
		{
			code: `a,\nb {}`,
			description: `no space in front of the comma and a newline after it`,
		},
		{
			code: `a,\r\nb {}`,
			description: `the same list written with a carriage-return line break`,
		},
		{
			code: `a,b[data-foo="tr ,tr"] {}`,
			description: `a spaced comma inside an attribute value, which is no comma of the list`,
		},
		{
			code: `a:matches(:hover , :focus) {}`,
			description: `spaced commas inside the argument of a pseudo-class`,
		},
		{
			code: `:not(:hover , :focus) {}`,
			description: `the same inside a negation`,
		},
		{
			code: `a/*comment ,comment*/,/*comment*/b {}`,
			description: `a spaced comma inside the text of a comment, with none in the list itself`,
		},
	],

	reject: [
		{
			code: `a ,b {}`,
			fixed: `a,b {}`,
			description: `a space in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a  ,b {}`,
			fixed: `a,b {}`,
			description: `two spaces in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 4,
		},
		{
			code: `a\n,b {}`,
			fixed: `a,b {}`,
			description: `a newline in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a\r\n,b {}`,
			fixed: `a,b {}`,
			description: `a carriage-return line break in front of the comma`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
		{
			code: `a\t,b {}`,
			fixed: `a,b {}`,
			description: `a tab in front of the comma`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 3,
		},
		{
			code: `a,b ,c {}`,
			fixed: `a,b,c {}`,
			description: `a space in front of the second of two commas`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 5,
		},
		{
			code: `a,b  ,c {}`,
			fixed: `a,b,c {}`,
			description: `two spaces in front of the second of two commas`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 6,
		},
		{
			code: `a/*comment*/ ,/*comment*/b {}`,
			fixed: `a/*comment*/,/*comment*/b {}`,
			description: `a space in front of a comma standing between two comments`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 14,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a ,b {}`,
			description: `a space in front of the comma of a single-line list`,
		},
		{
			code: `a ,b {\n}`,
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
		},
		{
			code: `a ,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
		},
	],

	reject: [
		{
			code: `a,b {}`,
			fixed: `a ,b {}`,
			description: `no space in front of the comma of a single-line list`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b {\n}`,
			fixed: `a ,b {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a,b {\r\n}`,
			fixed: `a ,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 2,
		},
		{
			code: `a/*comment*/,/*comment*/b {\n}`,
			fixed: `a/*comment*/ ,/*comment*/b {\n}`,
			description: `no space in front of a comma standing between two comments, in front of a multi-line block`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 13,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a,b {}`,
			description: `no space in front of the comma of a single-line list`,
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
			code: `a ,b {}`,
			fixed: `a,b {}`,
			description: `a space in front of the comma of a single-line list`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a ,b {\n}`,
			fixed: `a,b {\n}`,
			description: `the same list in front of a multi-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a ,b {\r\n}`,
			fixed: `a,b {\r\n}`,
			description: `the same list and block written with a carriage-return line break`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 3,
		},
		{
			code: `a/*comment*/ ,/*comment*/b {\n}`,
			fixed: `a/*comment*/,/*comment*/b {\n}`,
			description: `a space in front of a comma standing between two comments, in front of a multi-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 14,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			code: `.a // c\n.b , .c {}`,
			fixed: `.a // c\n.b, .c {}`,
			description: `a selector carrying an inline comment, whose fix reaches the copy the file spells, reported in the file's own coordinates`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 4,
		},
		{
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.rejectedBefore(),
			line: 2,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			code: `.a // c\n, .b {}`,
			fixed: `.a // c\n, .b {}`,
			description: `a comma whose whitespace holds the break that closes an inline comment, which the fixer has to leave standing`,
			message: messages.expectedBefore(),
			line: 2,
			column: 1,
		},
	],
})
