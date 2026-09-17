import { createRule } from "../../../../rules/declaration-bang-space-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace and closes by the count of parentheses, through a string
			description: `a bang glued to the name of a bare address a space parts from its parenthesis, opening on whitespace and holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1!url ( a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1!url ( a ")" b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace: a string right behind the whitespace is its text
			description: `a bang glued to the name of a bare address opening on whitespace in front of a string holding a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1!url( "a)" ) 2px; c: "d" }`,
			fixed: `a { b: 1!url( "a)" ) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the refusal where the url token closes in front of the parenthesis code closes the address at: a semicolon between the two would end the declaration once the token has closed
			description: `a bang glued to the name of a bare address holding a group with a string closing it early to the count of parentheses, and a semicolon in front of the parenthesis code closes the address at`,
			code: `a { b: 1!url(a(b"c)d"e) ; ) 2px; c: "d" }`,
			fixed: `a { b: 1!url(a(b"c)d"e) ; ) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of the url token `postcss-scss` closes by the count of parentheses: a group inside the address closes where code closes it, so the write is harmless
			description: `a bang glued to the name of a bare address holding a parenthesised group, which the tokenizer and the code reading close at the same parenthesis`,
			code: `a { b: 1!url(a(b)c) 2px; c: "d" }`,
			fixed: `a { b: 1! url(a(b)c) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.expectedAfter(),
		},
		{
			// Pins the reading of an interpolation between the name and its parenthesis as a token pushing no word under this tokenizer
			description: `a bang glued to the name of a bare address, an interpolation between the name and its parenthesis, holding a string with a closing parenthesis, which a written space would make the tokenizer close inside the string`,
			code: `a { b: 1!url#{a}(a ")" b) 2px; c: "d" }`,
			fixed: `a { b: 1!url#{a}(a ")" b) 2px; c: "d" }`,
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

	reject: [
		{
			// Pins the reading of the url token `postcss-scss` opens behind whitespace and closes by the count of parentheses, through a string
			description: `a space between a bang and the name of a bare address a space parts from its parenthesis, opening on whitespace and holding a quotation mark nothing closes, which taking the space away would make the tokenizer read as a string`,
			code: `a { b: 1! url ( a"b) 2px; c: "d" }`,
			fixed: `a { b: 1! url ( a"b) 2px; c: "d" }`,
			line: 1,
			column: 9,
			message: messages.rejectedAfter(),
		},
	],
})
