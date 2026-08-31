import { createRule } from "../../../../rules/function-max-empty-lines/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [0],
	customSyntax: `postcss-less`,

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a call whose name stands in the text of an end-of-line comment, with the empty lines and the arguments on the lines below`,
			code: `a { b: f(1) // g(\n\n\n2)\n; }`,
		},
		{
			description: `the same comment with a form feed inside it, which is whitespace and closes no comment, so the call behind it is the comment's text as well`,
			code: `a { b: f(1) // c\fg(\n\n\n2)\n; }`,
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
	],
})
