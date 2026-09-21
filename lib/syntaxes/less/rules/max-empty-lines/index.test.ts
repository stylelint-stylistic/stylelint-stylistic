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
		{
			description: `two blank lines behind an end-of-line comment holding a quotation mark, which opens no string`,
			code: `a {} // it's\n\n\nb { c: 'd' }`,
			fixed: `a {} // it's\n\nb { c: 'd' }`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		// See #581
		{
			description: `two blank lines between the flag of a mixin call and the semicolon closing it, which the parser keeps behind the flag`,
			code: `a {\n\t.m() !important\n\n\n;\n}\n`,
			fixed: `a {\n\t.m() !important\n\n;\n}\n`,
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
		// See #586
		{
			description: `three blank lines behind an end-of-line comment whose breaks take turns between a carriage-return pair and a bare newline`,
			code: `a {} // c\r\n\n\r\n\nb {}`,
			fixed: `a {} // c\r\n\nb {}`,
			warnings: [
				{
					line: 3,
					column: 1,
					message: messages.expected(1),
				},
				{
					line: 4,
					column: 1,
					message: messages.expected(1),
				},
			],
		},
		// See #725
		{
			description: `two blank lines in front of the closing brace behind a protocol-relative address, whose double slash opens no comment`,
			code: `a {\n\tb: url(//x.y/z);\n\n\n}\n`,
			fixed: `a {\n\tb: url(//x.y/z);\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})
