import { createRule } from "../../../../rules/value-slash-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4/$a; }`,
		},
		{
			description: `a solidus beside a call, which Sass divides at`,
			code: `a { b: fn()/2; }`,
		},
		{
			description: `a solidus in front of an inline comment, with a space between them`,
			code: `a { b: 1 / // c\n 2; }`,
		},
	],

	reject: [
		{
			description: `a solidus beside a call Sass hands through as plain CSS, which keeps the separator`,
			code: `a { b: var(--x)/2; }`,
			fixed: `a { b: var(--x)/ 2; }`,
			line: 1,
			column: 16,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal to part the name of a bare address from the solidus where a space stands between the name and its parenthesis, which switches how the tokenizer reads the parentheses
			description: `a solidus glued to the name of a bare address a space parts from its parenthesis, holding a string with a closing parenthesis`,
			code: `a { b: 1/url (a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url (a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace and closes by the count of parentheses, through a string
			description: `a solidus glued to the name of a bare address a space parts from its parenthesis, opening on whitespace and holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url ( a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url ( a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a comma between the name and its parenthesis as a token pushing no word under this tokenizer, which ends a word on it
			description: `a solidus glued to the name of a bare address, a comma between the name and its parenthesis, holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url,(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url,(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of a comment to the end of the line between the name and its parenthesis as a token pushing no word under this tokenizer
			description: `a solidus glued to the name of a bare address, an inline comment between the name and its parenthesis, holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1/url // c\n(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1/url // c\n(a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a solidus beside a variable, which Sass divides at`,
			code: `a { b: 4 / $a; }`,
		},
	],

	reject: [
		{
			description: `a space between the solidus and an inline comment, which the fixer has to leave standing: closed up, the solidus would open the comment`,
			code: `a { b: 1 / // c\n 2; }`,
			fixed: `a { b: 1 / // c\n 2; }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfter(),
		},
		{
			description: `a space between the solidus and a block comment, which the fixer has to leave standing for the same reason`,
			code: `a { b: 1 / /*c*/ 2; }`,
			fixed: `a { b: 1 / /*c*/ 2; }`,
			line: 1,
			column: 10,
			message: messages.rejectedAfter(),
		},
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace and closes by the count of parentheses, through a string
			description: `a space between a solidus and the name of a bare address a space parts from its parenthesis, opening on whitespace and holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1/ url ( a"b) 2px; c: "d" }`,
			fixed: `a { b: 1/ url ( a"b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
	],
})
