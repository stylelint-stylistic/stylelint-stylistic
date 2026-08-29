import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `double spaces inside comments, which the rule does not read`,
			code: `/* This  is  comment */\na { gap: 0 /* And   another   comment */ }`,
		},
		{
			description: `spaces inside a string`,
			code: `a::before { content: "   " }`,
		},
		{
			description: `spaces inside the strings of a named grid area`,
			code: `a { grid-template-areas: "a  b" "c  d" }`,
		},
		{
			description: `a single space between the parts of a value`,
			code: `a { gap: 1em 2em }`,
		},
		{
			description: `single spaces around a slash`,
			code: `a { aspect-ratio: 1 / 2 }`,
		},
		{
			description: `a slash with no spaces around it`,
			code: `a { aspect-ratio: 1/2 }`,
		},
		{
			description: `single spaces between the arguments of a function`,
			code: `a { color: rgb(0 0 0) }`,
		},
		{
			description: `a slash with no spaces around it inside a function`,
			code: `a { color: rgb(0 0 0/0) }`,
		},
		{
			description: `single spaces around a slash inside a function`,
			code: `a { color: rgb(0 0 0 / 0) }`,
		},
		{
			description: `a comma with no space after it inside a function`,
			code: `a { transform: translate(50%,50%) }`,
		},
		{
			description: `a single space after a comma inside a function`,
			code: `a { transform: translate(50%, 50%) }`,
		},
		{
			description: `indentation on the line after the opening brace`,
			code: `a {\n  color: pink }`,
		},
		{
			description: `indentation on the line after a declaration`,
			code: `a { color: red;\n  top: 0 }`,
		},
		{
			description: `indentation inside a value broken over three lines`,
			code: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
		},
	],

	reject: [
		{
			description: `two spaces between the parts of a value`,
			code: `a { gap: 1em  2em }`,
			fixed: `a { gap: 1em 2em }`,
			line: 1,
			column: 13,
			message: messages.rejected,
		},
		{
			description: `two spaces between two strings`,
			code: `a { grid-template-areas: "a  b"  "c  d" }`,
			fixed: `a { grid-template-areas: "a  b" "c  d" }`,
			line: 1,
			column: 32,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash`,
			code: `a { aspect-ratio: 1  / 2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash`,
			code: `a { aspect-ratio: 1 /  2 }`,
			fixed: `a { aspect-ratio: 1 / 2 }`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `two spaces after the first argument of a function`,
			code: `a { color: rgb(0  0 0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `two spaces after the second argument of a function`,
			code: `a { color: rgb(0 0  0) }`,
			fixed: `a { color: rgb(0 0 0) }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `two spaces in front of a slash inside a function`,
			code: `a { color: rgb(0 0 0  / 0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `two spaces behind a slash inside a function`,
			code: `a { color: rgb(0 0 0 /  0) }`,
			fixed: `a { color: rgb(0 0 0 / 0) }`,
			line: 1,
			column: 23,
			message: messages.rejected,
		},
		{
			description: `two spaces after a comma inside a function`,
			code: `a { transform: translate(50%,  50%) }`,
			fixed: `a { transform: translate(50%, 50%) }`,
			line: 1,
			column: 30,
			message: messages.rejected,
		},
		{
			description: `two spaces on the second line of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 3,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on the third line of a value`,
			code: `
				a {
				  background-position:
				    top left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			line: 4,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `two spaces on both lines of a value`,
			code: `
				a {
				  background-position:
				    top  left,
				    top  right;
				}
			`,
			fixed: `
				a {
				  background-position:
				    top left,
				    top right;
				}
			`,
			message: messages.rejected,
			warnings: [
				{
					line: 3,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 4,
					column: 8,
					message: messages.rejected,
				},
			],
		},
	],
})
