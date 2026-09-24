import { createRule } from "../../../../rules/declaration-colon-newline-after/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	extraRules: { "@stylistic/linebreaks": `windows` },

	reject: [
		{
			description: `a plain CSS file on one line, with the rule asking for Windows pairs listed under the core's name, which reads the same file`,
			code: `a { color: red; }`,
			fixed: `a { color:\r\n red; }`,
			line: 1,
			column: 10,
			endLine: 1,
			endColumn: 11,
			message: messages.expectedAfter(),
		},
	],
})
