import { createRule } from "../../../../rules/function-max-empty-lines/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-scss`,

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a call whose name stands in the text of an end-of-line comment, with the empty lines and the arguments on the lines below`,
			code: `a { b: f(1) // g(\n\n\n2)\n; }`,
		},
		{
			description: `the same value spelled with carriage returns`,
			code: `a { b: f(1) // g(\r\n\r\n\r\n2)\r\n; }`,
		},
		{
			description: `a call the parser opened in such a comment and closed on a call the file does write, whose own empty lines it holds none of`,
			code: `a { b: 1 // g(\n\n\nf(2); }`,
		},
		{
			description: `the same call written in a block comment, which the parser has a node of its own for`,
			code: `a { b: f(1) /* g( */\n\n\n2)\n; }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a call standing on the line below such a comment, inside the one the parser opened in the comment's text`,
			code: `a { b: f(1) // g(\nh(\n\n\n2)\n)\n; }`,
			fixed: `a { b: f(1) // g(\nh(\n2)\n)\n; }`,
			line: 1,
			column: 18,
			message: messages.expected(0),
		},
		{
			description: `empty lines inside a call an end-of-line comment stands behind`,
			code: `a { b: f(\n\n\n1) // c\n; }`,
			fixed: `a { b: f(\n1) // c\n; }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		{
			description: `a call behind an address, whose double slash opens no comment`,
			code: `a { b: url(http://x) f(\n\n\n1); }`,
			fixed: `a { b: url(http://x) f(\n1); }`,
			line: 1,
			column: 21,
			message: messages.expected(0),
		},
		{
			description: `a call the parser closed on a parenthesis standing inside an end-of-line comment, whose empty lines stand in front of the comment`,
			code: `a { b: f(1\n\n\n// x) y\n2); }`,
			fixed: `a { b: f(1\n// x) y\n2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/370
		{
			description: `a comment opening with a solidus, a star and a solidus, standing in the text of an end-of-line comment the fix writes over`,
			code: `a { b: f(1\n\n\n2 // /*/x\n); }`,
			fixed: `a { b: f(1\n2 // /*/x\n); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
	],
})
