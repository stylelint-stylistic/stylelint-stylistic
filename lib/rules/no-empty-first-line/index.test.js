import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: ``,
			description: `an empty stylesheet`,
		},
		{
			code: `  `,
			description: `a stylesheet holding nothing but spaces`,
		},
		{
			code: `\n`,
			description: `a stylesheet holding a single line feed and nothing else`,
		},
		{
			code: `\n\n`,
			description: `a stylesheet holding two line feeds and nothing else`,
		},
		{
			code: `.class {}`,
			description: `a rule opening the first line`,
		},
		{
			code: `\t.class {}   `,
			description: `a rule opening the first line behind a tab`,
		},
		{
			code: `   .class {}   `,
			description: `a rule opening the first line behind spaces`,
		},
		{
			code: `/* comment */`,
			description: `a comment opening the first line`,
		},
	],
	reject: [
		{
			code: `\n.class {} \n`,
			fixed: `.class {} \n`,
			description: `an empty first line in front of a rule`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `\r\n.class {}`,
			fixed: `.class {}`,
			description: `the same written with a carriage-return line break`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `\n/*some comment*/\n`,
			fixed: `/*some comment*/\n`,
			description: `an empty first line in front of a comment`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `\n/*some comment*/.class {}\na {}\n`,
			fixed: `/*some comment*/.class {}\na {}\n`,
			description: `an empty first line in front of a comment the rules follow`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `\r\n\r\n\r\n\r\n.class {}`,
			fixed: `.class {}`,
			description: `four empty lines opening the stylesheet`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: ` \r\n\r\n\r\n\r\n.class {}`,
			fixed: `.class {}`,
			description: `the same lines, the first of them carrying a space`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `               \n.class {}`,
			fixed: `.class {}`,
			description: `an empty first line made of spaces`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `\n    .class {}`,
			fixed: `    .class {}`,
			description: `an empty first line in front of an indented rule`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
	],
})
