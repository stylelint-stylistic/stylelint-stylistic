import { createRule } from "../../../../rules/no-eol-whitespace/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `two spaces making up the whole of an inline comment a file ends on`,
			// This syntax files such a comment as `postcss-scss` files every one: an empty text, the whitespace in the raw in front and nothing in the raw behind.
			code: `//  `,
			fixed: `//`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			// A fix anywhere prints the call in front of the whitespace it spells there
			description: `a space ending a line above the stylesheet's last mixin call, which carries an important flag and no semicolon`,
			code: `
				a {}${S}
				.m() !important
			`,
			fixed: `
				a {}
				.m() !important
			`,
			line: 1,
			column: 5,
			message: messages.rejected,
		},
		{
			description: `a Less at-variable keeps the fix written to its params`,
			code: `
				@foo: (
					a,${S}${S}${S}
					b
				);
			`,
			fixed: `
				@foo: (
					a,
					b
				);
			`,
			line: 2,
			column: 6,
			message: messages.rejected,
		},
		{
			description: `a space ending the line behind a mixin call's important flag, with the call's semicolon on the next line`,
			code: `
				a {
					.m() !important${S}
					;
				}
			`,
			fixed: `
				a {
					.m() !important
					;
				}
			`,
			line: 2,
			column: 17,
			message: messages.rejected,
		},
	],
})
