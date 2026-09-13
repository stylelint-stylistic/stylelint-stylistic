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
		// See #481
		{
			description: `two blank lines in front of the closing brace behind a mixin call written without a semicolon, which the parser files inside the call itself`,
			code: `a {\n\t.m()\n\n\n}\n`,
			fixed: `a {\n\t.m()\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		// See #583
		{
			description: `two blank lines between two end-of-line comments, which the stringifier of PostCSS prints as block ones two characters wider`,
			code: `// one\n\n\n// two\n`,
			fixed: `// one\n\n// two\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		// See #583
		{
			description: `two blank lines behind a mixin call carrying a flag, which the stringifier of PostCSS leaves out`,
			code: `a {\n\t.m() !important;\n\n\n\tcolor: pink;\n}\n`,
			fixed: `a {\n\t.m() !important;\n\n\tcolor: pink;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1, { ignore: [`comments`] }],
	customSyntax: `postcss-less`,

	reject: [
		// See #583
		{
			description: `two blank lines between two end-of-line comments, whose closing break counts`,
			code: `// one\n\n\n// two\n`,
			fixed: `// one\n\n// two\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
	],
})
