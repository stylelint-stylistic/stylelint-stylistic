import { createRule } from "../../../../rules/max-empty-lines/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `a blank line in front of the closing brace behind a mixin call written without a semicolon`,
			code: `a {\n\t.m()\n\n}\n`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481
		{
			description: `two blank lines in front of the closing brace behind a mixin call written without a semicolon, which the parser files inside the call itself`,
			code: `a {\n\t.m()\n\n\n}\n`,
			fixed: `a {\n\t.m()\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})
