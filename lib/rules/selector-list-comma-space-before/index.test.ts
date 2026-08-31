import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space in front of the comma`,
			code: `a ,b {}`,
		},
		{
			description: `a space in front of each of the two commas`,
			code: `a ,b ,c {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `a , b {}`,
		},
		{
			description: `a space in front of the comma and a newline after it`,
			code: `a ,\nb {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a ,\r\nb {}`,
		},
		{
			description: `a comma inside an attribute value, which is no comma of the list`,
			code: `a ,b[data-foo="tr,tr"] {}`,
		},
		{
			description: `commas inside the argument of a pseudo-class, which are no commas of the list`,
			code: `a:matches(:hover, :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover, :focus) {}`,
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
			description: `a comma standing behind a comment and a space, with another comment after it`,
			code: `a/*comment,comment*/ ,/*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma`,
			code: `a,b {}`,
			fixed: `a ,b {}`,
			line: 1,
			column: 2,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a  ,b {}`,
			fixed: `a ,b {}`,
			line: 1,
			column: 4,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a\n,b {}`,
			fixed: `a ,b {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a\r\n,b {}`,
			fixed: `a ,b {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a\t,b {}`,
			fixed: `a ,b {}`,
			line: 1,
			column: 3,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the second of two commas`,
			code: `a ,b,c {}`,
			fixed: `a ,b ,c {}`,
			line: 1,
			column: 5,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the second of two commas`,
			code: `a ,b  ,c {}`,
			fixed: `a ,b ,c {}`,
			line: 1,
			column: 7,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of either of the two commas`,
			code: `a,b,c {}`,
			fixed: `a ,b ,c {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `no space in front of a comma standing between two comments`,
			code: `a/*comment*/,/*comment*/b {}`,
			fixed: `a/*comment*/ ,/*comment*/b {}`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of any of the six commas`,
			code: `a,b,c,d,e,f,g {}`,
			fixed: `a ,b ,c ,d ,e ,f ,g {}`,
			warnings: [
				{
					line: 1,
					column: 2,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 4,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 6,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 8,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedBefore(),
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
			description: `no space in front of the comma`,
			code: `a,b {}`,
		},
		{
			description: `no space in front of either of the two commas`,
			code: `a,b,c {}`,
		},
		{
			description: `no space in front of the comma and one after it`,
			code: `a, b {}`,
		},
		{
			description: `no space in front of the comma and a newline after it`,
			code: `a,\nb {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `a,\r\nb {}`,
		},
		{
			description: `a spaced comma inside an attribute value, which is no comma of the list`,
			code: `a,b[data-foo="tr ,tr"] {}`,
		},
		{
			description: `spaced commas inside the argument of a pseudo-class`,
			code: `a:matches(:hover , :focus) {}`,
		},
		{
			description: `the same inside a negation`,
			code: `:not(:hover , :focus) {}`,
		},
		{
			description: `a spaced comma inside the text of a comment, with none in the list itself`,
			code: `a/*comment ,comment*/,/*comment*/b {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma`,
			code: `a ,b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `a  ,b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 4,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `a\n,b {}`,
			fixed: `a,b {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `a\r\n,b {}`,
			fixed: `a,b {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `a\t,b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the second of two commas`,
			code: `a,b ,c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 5,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the second of two commas`,
			code: `a,b  ,c {}`,
			fixed: `a,b,c {}`,
			line: 1,
			column: 6,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of a comma standing between two comments`,
			code: `a/*comment*/ ,/*comment*/b {}`,
			fixed: `a/*comment*/,/*comment*/b {}`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `a ,b {}`,
		},
		{
			description: `a single-line list in front of a multi-line block, which does not make the list multi-line`,
			code: `a ,b {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a ,b {\r\n}`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `a,b {}`,
			fixed: `a ,b {}`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a,b {\n}`,
			fixed: `a ,b {\n}`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a,b {\r\n}`,
			fixed: `a ,b {\r\n}`,
			line: 1,
			column: 2,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `no space in front of a comma standing between two comments, in front of a multi-line block`,
			code: `a/*comment*/,/*comment*/b {\n}`,
			fixed: `a/*comment*/ ,/*comment*/b {\n}`,
			line: 1,
			column: 13,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `no space in front of the comma of a single-line list`,
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
			description: `a space in front of the comma of a single-line list`,
			code: `a ,b {}`,
			fixed: `a,b {}`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list in front of a multi-line block`,
			code: `a ,b {\n}`,
			fixed: `a,b {\n}`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `a ,b {\r\n}`,
			fixed: `a,b {\r\n}`,
			line: 1,
			column: 3,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a space in front of a comma standing between two comments, in front of a multi-line block`,
			code: `a/*comment*/ ,/*comment*/b {\n}`,
			fixed: `a/*comment*/,/*comment*/b {\n}`,
			line: 1,
			column: 14,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})
