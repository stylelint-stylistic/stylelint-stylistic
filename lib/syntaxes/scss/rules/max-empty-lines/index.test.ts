import { createRule } from "../../../../rules/max-empty-lines/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `two blank lines in front of an end-of-line comment`,
			code: `\n\n// one`,
		},
		{
			description: `two blank lines behind an end-of-line comment`,
			code: `// one\n\n`,
		},
		{
			description: `two blank lines between two end-of-line comments`,
			code: `// one\n\n\n// two\n`,
		},
	],

	reject: [
		{
			description: `three blank lines in front of an end-of-line comment`,
			code: `\n\n\n// one`,
			fixed: `\n\n// one`,
			line: 3,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind an end-of-line comment`,
			code: `// one\n\n\n`,
			fixed: `// one\n\n`,
			line: 4,
			column: 3,
			message: messages.expected(2),
		},
		{
			description: `three blank lines between two end-of-line comments`,
			code: `// one\n\n\n\n// two\n`,
			fixed: `// one\n\n\n// two\n`,
			line: 5,
			column: 2,
			message: messages.expected(2),
		},
	],
})
