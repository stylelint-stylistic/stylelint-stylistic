import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: `/* This  is  comment */\na { gap: 0 /* And   another   comment */ }`,
			description: `double spaces inside comments, which the rule does not read`,
		},
		{
			code: `a::before { content: "   " }`,
			description: `spaces inside a string`,
		},
		{
			code: `a { grid-template-areas: "a  b" "c  d" }`,
			description: `spaces inside the strings of a named grid area`,
		},
		{
			code: `a { gap: 1em 2em }`,
			description: `a single space between the parts of a value`,
		},
		{
			code: `a { aspect-ratio: 1 / 2 }`,
			description: `single spaces around a slash`,
		},
		{
			code: `a { aspect-ratio: 1/2 }`,
			description: `a slash with no spaces around it`,
		},
		{
			code: `a { color: rgb(0 0 0) }`,
			description: `single spaces between the arguments of a function`,
		},
		{
			code: `a { color: rgb(0 0 0/0) }`,
			description: `a slash with no spaces around it inside a function`,
		},
		{
			code: `a { color: rgb(0 0 0 / 0) }`,
			description: `single spaces around a slash inside a function`,
		},
		{
			code: `a { transform: translate(50%,50%) }`,
			description: `a comma with no space after it inside a function`,
		},
		{
			code: `a { transform: translate(50%, 50%) }`,
			description: `a single space after a comma inside a function`,
		},
		{
			code: `a {\n  color: pink }`,
			description: `indentation on the line after the opening brace`,
		},
		{
			code: `a { color: red;\n  top: 0 }`,
			description: `indentation on the line after a declaration`,
		},
		{
			code: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `indentation inside a value broken over three lines`,
		},
	],

	reject: [
		{
			code: `a { gap: 1em  2em }`,
			fixed: `a { gap: 1em 2em }`,
			description: `two spaces between the parts of a value`,
			message: messages.rejected,
			line: 1,
			column: 13,
		},
		{
			code: `a { grid-template-areas: "a  b"  "c  d" }`,
			fixed: `a { grid-template-areas: "a  b" "c  d" }`,
			description: `two spaces between two strings`,
			message: messages.rejected,
			line: 1,
			column: 32,
		},
		{
			code: `a { aspect-ratio: 1  / 2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			description: `two spaces in front of a slash`,
			message: messages.rejected,
			line: 1,
			column: 20,
		},
		{
			code: `a { aspect-ratio: 1 /  2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			description: `two spaces behind a slash`,
			message: messages.rejected,
			line: 1,
			column: 22,
		},
		{
			code: `a { color: rgb(0  0 0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			description: `two spaces after the first argument of a function`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: rgb(0 0  0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			description: `two spaces after the second argument of a function`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: rgb(0 0 0  / 0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			description: `two spaces in front of a slash inside a function`,
			message: messages.rejected,
			line: 1,
			column: 21,
		},
		{
			code: `a { color: rgb(0 0 0 /  0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			description: `two spaces behind a slash inside a function`,
			message: messages.rejected,
			line: 1,
			column: 23,
		},
		{
			code: `a { transform: translate(50%,  50%) }`,
			fixed: `a { transform: translate(50%, 50%) }`,
			description: `two spaces after a comma inside a function`,
			message: messages.rejected,
			line: 1,
			column: 30,
		},
		{
			code: `a {\n  background-position:\n    top  left,\n    top right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `two spaces on the second line of a value`,
			message: messages.rejected,
			line: 3,
			column: 8,
		},
		{
			code: `a {\n  background-position:\n    top left,\n    top  right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `two spaces on the third line of a value`,
			message: messages.rejected,
			line: 4,
			column: 8,
		},
		{
			code: `a {\n  background-position:\n    top  left,\n    top  right;\n}`,
			fixed: `a {\n  background-position:\n    top left,\n    top right;\n}`,
			description: `two spaces on both lines of a value`,
			message: messages.rejected,
			warnings: [
				{
					message: messages.rejected,
					line: 3,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 4,
					column: 8,
				},
			],
		},
	],
})
