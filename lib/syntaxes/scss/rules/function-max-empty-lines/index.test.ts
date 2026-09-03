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
			description: `the name of a call written in the text of an end-of-line comment, with the empty lines and the arguments on the lines below`,
			code: `a { b: f(1) // g(\n\n\n2)\n; }`,
		},
		{
			description: `the same value spelled with carriage returns`,
			code: `a { b: f(1) // g(\r\n\r\n\r\n2)\r\n; }`,
		},
		{
			description: `the opening of a call written in such a comment, with a call the file does write standing behind the empty lines`,
			code: `a { b: 1 // g(\n\n\nf(2); }`,
		},
		{
			description: `the same opening written in a block comment, whose text opens no call of the value either`,
			code: `a { b: f(1) /* g( */\n\n\n2)\n; }`,
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
			description: `the empty lines of the call standing in front of an end-of-line comment holding the parenthesis that would close it, which the fix collapses without reaching the comment`,
			code: `a { b: f(1\n\n\n// x) y\n2); }`,
			fixed: `a { b: f(1\n// x) y\n2); }`,
			line: 1,
			column: 7,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/370
		{
			description: `a comment opening with a solidus, a star and a solidus, standing in the text of an end-of-line comment the call reaches past`,
			code: `a { b: f(1\n\n\n2 // /*/x\n); }`,
			fixed: `a { b: f(1\n2 // /*/x\n); }`,
			line: 1,
			column: 7,
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
