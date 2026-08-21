import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `a comment standing at the root, with no indentation to measure`,
			code: `/* blergh */`,
		},
		{
			description: `a comment indented with the declaration it stands over`,
			code: `
				.foo {
					/* blergh */
					top: 0;
				}
			`,
		},
		{
			description: `a comment indented two levels deep inside a media query`,
			code: `
				@media print {
					.foo {
						/* blergh */
						top: 0;
					}
				}
			`,
		},
		{
			description: `the same rule written with carriage-return line breaks`,
			code: `.foo {\r\n\t/* blergh */\r\n\ttop: 0;\r\n}`,
		},
		{
			description: `the same media query written with carriage-return line breaks`,
			code: `@media print {\r\n\t.foo {\r\n\t\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
		},
	],

	reject: [
		{
			autoStripIndent: false,
			description: `a comment indented by a space at the root`,
			code: ` /* blergh */`,
			fixed: `/* blergh */`,
			line: 1,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a comment indented one level deeper than the declaration it stands over`,
			code: `
				.foo {
						/* blergh */
					top: 0;
				}
			`,
			fixed: `
				.foo {
					/* blergh */
					top: 0;
				}
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a comment indented one level shallower than the declaration it stands over`,
			code: `
				@media print {
					.foo {
					/* blergh */
						top: 0;
					}
				}
			`,
			fixed: `
				@media print {
					.foo {
						/* blergh */
						top: 0;
					}
				}
			`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `the same rule written with carriage-return line breaks`,
			code: `.foo {\r\n\t\t/* blergh */\r\n\ttop: 0;\r\n}`,
			fixed: `.foo {\r\n\t/* blergh */\r\n\ttop: 0;\r\n}`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same media query written with carriage-return line breaks`,
			code: `@media print {\r\n\t.foo {\r\n\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
			fixed: `@media print {\r\n\t.foo {\r\n\t\t/* blergh */\r\n\t\ttop: 0;\r\n\t}\r\n}`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
	],
})
