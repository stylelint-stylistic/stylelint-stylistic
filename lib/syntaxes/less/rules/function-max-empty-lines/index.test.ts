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
			description: `the name of a call written in the text of an end-of-line comment, with the empty lines and the arguments on the lines below`,
			code: `a { b: f(1) // g(\n\n\n2)\n; }`,
		},
		{
			description: `the same comment with a form feed inside it, which is whitespace and closes no comment, so what stands behind it to the end of the line is the comment's text as well`,
			code: `a { b: f(1) // c\fg(\n\n\n2)\n; }`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/503
		{
			description: `the empty lines a block comment holds inside a call, which are text of the comment and no lines of the call`,
			code: `a { b: f(1,\n/* g(\n\n\n2) */ 3); }`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a call written on the line below such a comment, holding empty lines of its own`,
			code: `a { b: f(1) // g(\nh(\n\n\n2)\n)\n; }`,
			fixed: `a { b: f(1) // g(\nh(\n2)\n)\n; }`,
			line: 1,
			column: 18,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/503
		{
			description: `an end-of-line comment holding the parenthesis that would close the call, which closes nothing standing there, so the empty lines behind it are the call's`,
			code: `a { b: f(1 // x)\n\n\n2); }`,
			fixed: `a { b: f(1 // x)\n2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
	],
})
