import { createRule } from "../../../../rules/function-comma-space-after/index.ts"
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
			code: `$map: (key: value,key2: value2)`,
		},
		{
			description: `an SCSS list, whose parentheses open no call either`,
			code: `$list: (value,value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map, whose parentheses open no call`,
			code: `$map: (key: value, key2: value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`always-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line`,
			code: `$map: (key: value,key2: value2)`,
		},
	],
})
testRule({
	ruleName,
	config: [`never-single-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS map written on one line`,
			code: `$map: (key: value, key2: value2)`,
		},
	],
})

// The run behind the comma is the one in front of the comment, not the break that closes the comment's line
testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `a single space behind the comma and an end-of-line comment behind the space`,
			code: `a {\n\tb: f(1, // c\n\t\t2);\n}\n`,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			description: `that space, which the option refuses, leaving a call it accepts`,
			code: `a {\n\tb: f(1, // c\n\t\t2);\n}\n`,
			fixed: `a {\n\tb: f(1,// c\n\t\t2);\n}\n`,
			line: 2,
			column: 8,
			message: messages.rejectedAfter(),
		},
	],
})
