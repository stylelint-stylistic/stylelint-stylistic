import { createRule } from "../../../../rules/selector-max-empty-lines/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-less`,

	accept: [
		{
			description: `blank lines inside the text of a block comment of the selector`,
			code: `.a /*c\n\n\nd*/, .b { color: red }`,
		},
	],

	reject: [
		// The parser leaves an end-of-line comment of a selector in the raw, and the compiler renders every part below it as a selector of its own
		{
			description: `a blank line of the selector below an end-of-line comment whose text spells the delimiters opening a comment`,
			code: `.a // c /*\n, .b\n\n\n, .c /* d */ , .e { color: red }`,
			fixed: `.a // c /*\n, .b\n, .c /* d */ , .e { color: red }`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
	],
})
