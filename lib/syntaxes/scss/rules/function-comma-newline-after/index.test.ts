import { createRule } from "../../../../rules/function-comma-newline-after/index.ts"
import { scss } from "../../index.ts"

let { messages, ruleName } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value, key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value, value2)`,
		},
		{
			description: `a comma inside an inline comment holding a parenthesis, in an address Sass reads as code`,
			code: `a { b: fn(url(a // ) , b\n), 1px); }`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken in front of its comma`,
			code: `$map: (key: value\n, key2: value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map broken behind its comma`,
			code: `$map: (key: value,\nkey2: value2)`,
		},
		{
			description: `a comment behind the whole declaration, on the same line`,
			code: `
				a {
				  transform: translate(1px, 1px); // line comment
				}
			`,
		},
	],
})

// A comment carries no break of the comma's: the run the rule reads and writes is the one at the comma
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `an inline comment behind the comma, with the break behind the comment`,
			code: `a {\n  transform: translate(\n    1px, // line comment\n    1px\n  );\n}`,
			fixed: `a {\n  transform: translate(\n    1px,\n// line comment\n    1px\n  );\n}`,
			line: 3,
			column: 8,
			message: messages.expectedAfter(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `the same comment in a call the file breaks across lines`,
			code: `a {\n  transform: translate(\n    1px, // line comment\n    1px\n  );\n}`,
			fixed: `a {\n  transform: translate(\n    1px,\n// line comment\n    1px\n  );\n}`,
			line: 3,
			column: 8,
			message: messages.expectedAfterMultiLine(),
		},
	],
})

// The run behind the comma is the one in front of the comment, not the break that closes the comment's line
testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `a single space behind the comma and an end-of-line comment behind the space`,
			code: `a {\n\tb: f(1, // c\n\t\t2);\n}\n`,
			fixed: `a {\n\tb: f(1,// c\n\t\t2);\n}\n`,
			line: 2,
			column: 8,
			message: messages.rejectedAfterMultiLine(),
		},
	],
})
