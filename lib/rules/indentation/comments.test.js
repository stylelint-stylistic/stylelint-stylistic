import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			code: `/* blergh */`,
			description: `a comment standing at the root, with no indentation to measure`,
		},
		{
			code: `.foo {\n\t/* blergh */\n\ttop: 0;\n}`,
			description: `a comment indented with the declaration it stands over`,
		},
		{
			code: `@media print {\n\t.foo {\n\t\t/* blergh */\n\t\ttop: 0;\n\t}\n}`,
			description: `a comment indented two levels deep inside a media query`,
		},
		{
			code: `.foo {\r\n\t/* blergh */\r\n\ttop: 0;\r\n}`,
			description: `the same rule written with carriage-return line breaks`,
		},
		{
			code: `@media print {\r\n\t.foo {\r\n\t\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
			description: `the same media query written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: ` /* blergh */`,
			fixed: `/* blergh */`,
			description: `a comment indented by a space at the root`,
			message: messages.expected(`0 tabs`),
			line: 1,
			column: 2,
		},
		{
			code: `.foo {\n\t\t/* blergh */\n\ttop: 0;\n}`,
			fixed: `.foo {\n\t/* blergh */\n\ttop: 0;\n}`,
			description: `a comment indented one level deeper than the declaration it stands over`,

			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			code: `@media print {\n\t.foo {\n\t/* blergh */\n\t\ttop: 0;\n\t}\n}`,
			fixed: `@media print {\n\t.foo {\n\t\t/* blergh */\n\t\ttop: 0;\n\t}\n}`,
			description: `a comment indented one level shallower than the declaration it stands over`,

			message: messages.expected(`2 tabs`),
			line: 3,
			column: 2,
		},
		{
			code: `.foo {\r\n\t\t/* blergh */\r\n\ttop: 0;\r\n}`,
			fixed: `.foo {\r\n\t/* blergh */\r\n\ttop: 0;\r\n}`,
			description: `the same rule written with carriage-return line breaks`,

			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			code: `@media print {\r\n\t.foo {\r\n\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
			fixed: `@media print {\r\n\t.foo {\r\n\t\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
			description: `the same media query written with carriage-return line breaks`,

			message: messages.expected(`2 tabs`),
			line: 3,
			column: 2,
		},
	],
})
