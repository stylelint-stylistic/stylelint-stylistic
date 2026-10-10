import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			// An escape is a character of its word, and the search the commas are found with reads none
			description: `an escaped comma inside a word, which is no comma of the list`,
			code: `@media a ,b\\,c {}`,
		},
		{
			description: `a comma inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b,c=d)`,
		},
		{
			description: `a single query, with no comma to measure`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `a space on either side of the comma`,
			code: `@media screen and (color) , projection and (color) {}`,
		},
		{
			description: `a space in front of the comma and two after it`,
			code: `@media screen and (color) ,  projection and (color) {}`,
		},
		{
			description: `a space in front of the comma and a newline after it`,
			code: `@media screen and (color) ,\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color) ,\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color), projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color), projection and (color) {}`,
		},
		{
			description: `a bare address in front of the comma, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
		},
		{
			description: `a comma inside the arguments of a function is a comma of the address and of no query list`,
			code: `@media (min-width: url(x/a,b.png)) { a { b: c; } }`,
		},
	],

	reject: [
		// The run in front of a comma opening the parameters is read in the at-rule's raw behind its name, written there where no live neighbor writing that raw asks otherwise
		{
			description: `a break in front of a comma opening the parameters, behind the name`,
			code: `@media\n,a { b { c: d } }`,
			fixed: `@media ,a { b { c: d } }`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// Pins the refusal of a write behind a backslash delimiter
			description: `a backslash ending the query in front of a line break and the comma, where the space would stand behind the backslash as its escaped character, so the warning stands`,
			code: `@media a ,b\\\n,c {}`,
			fixed: `@media a ,b\\\n,c {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			// The run in front of the delimiter is read over the copy with its escapes masked
			description: `an escaped space in front of the comma, which is a character of the word and no space`,
			code: `@media a ,b\\ ,c {}`,
			fixed: `@media a ,b\\  ,c {}`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of a comma behind an escaped backslash, which is a comma of the list`,
			code: `@media a ,b\\\\,c {}`,
			fixed: `@media a ,b\\\\ ,c {}`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `no space in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.expectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `a comment standing right in front of the comma`,
			code: `@media screen and (color)/*comment*/, projection and (color) {}`,
			fixed: `@media screen and (color)/*comment*/ , projection and (color) {}`,
			line: 1,
			column: 37,
			message: messages.expectedBefore(),
		},
		{
			description: `three commas in a list of media types, none of them with a space in front`,
			code: `@media tv,tv,tv,print {}`,
			fixed: `@media tv ,tv ,tv ,print {}`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 16,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comma behind a bare address, whose double slash opens no comment`,
			code: `@media (min-width: url(http://x/y.png)),print { a { b: c; } }`,
			fixed: `@media (min-width: url(http://x/y.png)) ,print { a { b: c; } }`,
			line: 1,
			column: 40,
			message: messages.expectedBefore(),
		},
		{
			description: `a double slash standing in the code of a plain CSS text, which spells no comment`,
			code: `@media (a//b),(c) { d { e: f; } }`,
			fixed: `@media (a//b) ,(c) { d { e: f; } }`,
			line: 1,
			column: 14,
			message: messages.expectedBefore(),
		},
		{
			// Under PostCSS's tokenizer a space right behind the `(` of an address keeps its parentheses code, so the quotation mark inside would open a string nothing closes
			description: `a comma right behind the opening parenthesis of an address holding a quotation mark, where the space in front of it is refused and the warning stands`,
			code: `@media url (,b"c) { a { b: c; } }`,
			fixed: `@media url (,b"c) { a { b: c; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
		{
			// A square bracket inside parentheses code reads is a group, and the params take the block into it
			description: `the same comma in an address holding a line break and a square bracket nothing closes, refused likewise`,
			code: `@media url (,\nb[c) { a { b: c; } }`,
			fixed: `@media url (,\nb[c) { a { b: c; } }`,
			line: 1,
			column: 13,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			// The run in front of the delimiter is read over the copy with its escapes masked
			description: `an escaped space in front of the comma, which is a character of the word and no whitespace`,
			code: `@media a,b\\ ,c {}`,
		},
		{
			description: `a comma with a space in front of it inside the address of an import, which opens no query list`,
			code: `@import url(x.com?a=b ,c=d)`,
		},
		{
			description: `a single query, with no comma to measure`,
			code: `@media (max-width: 600px) {}`,
		},
		{
			description: `the same query under a mixed-case at-rule name`,
			code: `@mEdIa (max-width: 600px) {}`,
		},
		{
			description: `the same query under an upper-case at-rule name`,
			code: `@MEDIA (max-width: 600px) {}`,
		},
		{
			description: `no space in front of the comma`,
			code: `@media screen and (color),projection and (color) {}`,
		},
		{
			description: `no space in front of the comma and one after it`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `no space in front of the comma and a newline after it`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) , projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) , projection and (color) {}`,
		},
	],

	reject: [
		{
			// Under PostCSS's tokenizer the space right behind the `(` keeps the parentheses code, and taken out it hands them to the address's token, which closes at the parenthesis inside the string
			description: `a comma behind whitespace right behind the opening parenthesis of an address holding a string with a closing parenthesis, where taking the whitespace out is refused and the warning stands`,
			code: `@media url ( ,"b)c") { a { b: c; } }`,
			fixed: `@media url ( ,"b)c") { a { b: c; } }`,
			line: 1,
			column: 14,
			message: messages.rejectedBefore(),
		},
		// The run in front of a comma opening the parameters is read in the at-rule's raw behind its name, which the fix does not empty, since that would join the name to the parameters
		{
			description: `a space in front of a comma opening the parameters, behind the name`,
			code: `@media ,a { b { c: d } }`,
			fixed: `@media ,a { b { c: d } }`,
			line: 1,
			column: 8,
			message: messages.rejectedBefore(),
		},
		{
			// Pins the refusal of a write behind a backslash delimiter
			description: `a backslash ending the query in front of a line break and the comma, which the write would turn into an escaped comma, so the warning stands`,
			code: `@media a,b\\\n,c {}`,
			fixed: `@media a,b\\\n,c {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma`,
			code: `@media screen and (color) , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma, under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) , projection and (color) {}`,
			fixed: `@mEdIa screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `a space in front of the comma, under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) , projection and (color) {}`,
			fixed: `@MEDIA screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the comma`,
			code: `@media screen and (color)  , projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 28,
			message: messages.rejectedBefore(),
		},
		{
			description: `a newline in front of the comma`,
			code: `@media screen and (color)\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a carriage-return line break in front of the comma`,
			code: `@media screen and (color)\r\n, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 2,
			column: 1,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the comma`,
			code: `@media screen and (color)\t, projection and (color) {}`,
			fixed: `@media screen and (color), projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBefore(),
		},
		{
			description: `spaces around a comment standing in front of the comma`,
			code: `@media screen and (color) /*comment*/ , projection and (color) {}`,
			fixed: `@media screen and (color) /*comment*/, projection and (color) {}`,
			line: 1,
			column: 39,
			message: messages.rejectedBefore(),
		},
		{
			description: `three commas in a list of media types, each with a space in front`,
			code: `@media tv ,tv ,tv ,print {}`,
			fixed: `@media tv,tv,tv,print {}`,
			warnings: [
				{
					line: 1,
					column: 11,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 19,
					message: messages.rejectedBefore(),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		// A list opening with a comma behind a break is multi-line, as it is where the break stands in front of a later comma, so a single-line option asks nothing of it
		{
			description: `a break in front of a comma opening the list`,
			code: `@media\n,a {}`,
		},
		{
			description: `a space in front of the comma of a single-line list`,
			code: `@media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `@media screen and (color),\nprojection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color),\r\nprojection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color), projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color), projection and (color) {}`,
		},
	],

	reject: [
		{
			description: `no space in front of the comma of a single-line list`,
			code: `@media screen and (color), projection and (color) {}`,
			fixed: `@media screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
			fixed: `@mEdIa screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
			fixed: `@MEDIA screen and (color) , projection and (color) {}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color), projection and (color) {\n}`,
			fixed: `@media screen and (color) , projection and (color) {\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color), projection and (color) {\r\n}`,
			fixed: `@media screen and (color) , projection and (color) {\r\n}`,
			line: 1,
			column: 26,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		// A list opening with a comma behind a break is multi-line, as it is where the break stands in front of a later comma, so a single-line option asks nothing of it
		{
			description: `a break in front of a comma opening the list`,
			code: `@media\n,a {}`,
		},
		{
			description: `no space in front of the comma of a single-line list`,
			code: `@media screen and (color), projection and (color) {}`,
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color), projection and (color) {}`,
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color), projection and (color) {}`,
		},
		{
			description: `a single-line list in a multi-line block, which does not make the list multi-line`,
			code: `@media screen and (color), projection and (color) {\n}`,
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color), projection and (color) {\r\n}`,
		},
		{
			description: `a multi-line list, which this option does not measure`,
			code: `@media screen and (color)\n,projection and (color) {}`,
		},
		{
			description: `the same list written with a carriage-return line break`,
			code: `@media screen and (color)\r\n,projection and (color) {}`,
		},
		{
			description: `an at-rule whose name ends in media`,
			code: `@non-media screen and (color) ,projection and (color) {}`,
		},
		{
			description: `an at-rule whose name opens with media`,
			code: `@media-non screen and (color) ,projection and (color) {}`,
		},
	],

	reject: [
		{
			description: `a space in front of the comma of a single-line list`,
			code: `@media screen and (color) ,projection and (color) {}`,
			fixed: `@media screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list under a mixed-case at-rule name`,
			code: `@mEdIa screen and (color) ,projection and (color) {}`,
			fixed: `@mEdIa screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list under an upper-case at-rule name`,
			code: `@MEDIA screen and (color) ,projection and (color) {}`,
			fixed: `@MEDIA screen and (color),projection and (color) {}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list in a multi-line block`,
			code: `@media screen and (color) ,projection and (color) {\n}`,
			fixed: `@media screen and (color),projection and (color) {\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same list and block written with a carriage-return line break`,
			code: `@media screen and (color) ,projection and (color) {\r\n}`,
			fixed: `@media screen and (color),projection and (color) {\r\n}`,
			line: 1,
			column: 27,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

// A vertical tab and a no-break space are words to PostCSS's tokenizer: the fix rewrites only the run the tokenizer reads beside its anchor, and such a character stays where the fix used to carry it off.
testRule({
	ruleName,
	config: [`always`],

	reject: [
		{
			description: `a vertical tab in front of the comma, a word to the tokenizer: the space is written beside the character, which stays`,
			code: `@media a\v, b {}`,
			fixed: `@media a\v , b {}`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	reject: [
		{
			description: `a vertical tab at the run before the comma: only the tokenizer's run goes, and the character stays`,
			code: `@media a\v , b {}`,
			fixed: `@media a\v, b {}`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 12,
			message: messages.rejectedBefore(),
		},
	],
})

// The run right behind the `(` of an address decides whether its parentheses are one token or code, and the run behind the comma, which the twin behind this rule writes in the same pass, decides what the parentheses then hold: asked together, the space is given where alone it was refused
testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/media-query-list-comma-space-after": `never` },

	reject: [
		{
			description: `a comma right behind the parenthesis of an address, with a break behind it that the twin behind this rule takes out, in front of a square bracket nothing closes`,
			code: `@media a url (,\nb[c) {}`,
			fixed: `@media a url ( ,b[c) {}`,
			warnings: [
				{
					line: 1,
					column: 15,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 15,
					message: `Unexpected whitespace after "," (@stylistic/media-query-list-comma-space-after)`,
				},
			],
		},
	],
})

// The break the twin behind this rule takes out from behind the comma is what hands the parentheses to an address's token, so the space this rule takes out in front of the comma is asked over the text that write leaves rather than the one standing, where the parentheses are still code with a square bracket nothing closes
testRule({
	ruleName,
	config: [`never`],
	extraRules: { "@stylistic/media-query-list-comma-space-after": `always` },

	reject: [
		{
			description: `a space in front of the comma of an address, with a break behind it that the twin behind this rule replaces in the same pass, in front of a square bracket nothing closes`,
			code: `@media a url ( ,\nb[c) {}`,
			fixed: `@media a url (, b[c) {}`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 16,
					message: `Expected single space after "," (@stylistic/media-query-list-comma-space-after)`,
				},
			],
		},
	],
})
