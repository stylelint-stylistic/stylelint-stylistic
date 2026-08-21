import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a stylesheet holding nothing but spaces`,
			code: `  `,
		},
		{
			description: `a stylesheet holding a single line feed and nothing else`,
			code: `\n`,
		},
		{
			description: `a stylesheet holding two line feeds and nothing else`,
			code: `\n\n`,
		},
		{
			description: `a rule opening the first line`,
			code: `.class {}`,
		},
		{
			description: `a rule opening the first line behind a tab`,
			code: `\t.class {}   `,
		},
		{
			description: `a rule opening the first line behind spaces`,
			code: `   .class {}   `,
		},
		{
			description: `a comment opening the first line`,
			code: `/* comment */`,
		},
	],
	reject: [
		{
			description: `an empty first line in front of a rule`,
			code: `\n.class {} \n`,
			fixed: `.class {} \n`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `\r\n.class {}`,
			fixed: `.class {}`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `an empty first line in front of a comment`,
			code: `\n/*some comment*/\n`,
			fixed: `/*some comment*/\n`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `an empty first line in front of a comment the rules follow`,
			code: `\n/*some comment*/.class {}\na {}\n`,
			fixed: `/*some comment*/.class {}\na {}\n`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `four empty lines opening the stylesheet`,
			code: `\r\n\r\n\r\n\r\n.class {}`,
			fixed: `.class {}`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `the same lines, the first of them carrying a space`,
			code: ` \r\n\r\n\r\n\r\n.class {}`,
			fixed: `.class {}`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `an empty first line made of spaces`,
			code: `               \n.class {}`,
			fixed: `.class {}`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `an empty first line in front of an indented rule`,
			code: `\n    .class {}`,
			fixed: `    .class {}`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
	],
})
