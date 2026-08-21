import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\n\n}`,
			description: `an empty line in front of the closing brace`,
		},
		{
			code: `a { color: pink;; ;\n\n}`,
			description: `stray semicolons in front of the empty line`,
		},
		{
			code: `a { color: pink;;\n\n;}`,
			description: `a stray semicolon behind the empty line, standing against the brace`,
		},
		{
			code: `a {color: pink;\r\n\r\n}`,
			description: `the empty line spelled with carriage returns`,
		},
		{
			code: `a {\ncolor: pink;\n\n}`,
			description: `a block broken open as well as closed`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\n\n}b { color: red;\n\n}`,
			description: `two blocks on one line, each with its own empty line`,
		},
		{
			code: `a {\ncolor: pink;\n\n\n\n}`,
			description: `more than one empty line, which the option allows as readily as one`,
		},
		{
			code: `@media print {\n  a {\n     color: pink;\n\n  }\n\n}`,
			description: `indentation standing between the empty line and the brace`,
		},
		{
			code: `@media print {\n\ta {\n\t\tcolor: pink;\n\t\t&:hover{\n\t\t\tcolor: red;\n\n\t\t\t}\n\n\t\t}\n\n}`,
			description: `three blocks nested, each closing behind an empty line of its own`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink;\n\n}`,
			description: `a break in front of the brace where an empty line belongs`,
			message: messages.expected,
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink;\r\n\r\n}`,
			description: `the same break spelled with a carriage return`,
			message: messages.expected,
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink;\n }`,
			fixed: `a { color: pink;\n\n }`,
			description: `a space of indentation behind the break`,
			message: messages.expected,
			line: 2,
			column: 2,
		},
		{
			code: `a { color: pink;\n\t}`,
			fixed: `a { color: pink;\n\n\t}`,
			description: `a tab of indentation behind the break`,
			message: messages.expected,
			line: 2,
			column: 2,
		},
		{
			code: `a { color: pink;\r\n  }`,
			fixed: `a { color: pink;\r\n\r\n  }`,
			description: `a carriage return with two spaces of indentation behind it`,
			message: messages.expected,
			line: 2,
			column: 3,
		},
		{
			code: `a { color: pink;\n;}`,
			fixed: `a { color: pink;\n;\n\n}`,
			description: `a stray semicolon standing where the empty line belongs`,
			message: messages.expected,
			line: 2,
			column: 2,
		},
		{
			code: `a {\ncolor: pink;\n}`,
			fixed: `a {\ncolor: pink;\n\n}`,
			description: `a block broken open, with no empty line to close it`,
			message: messages.expected,
			line: 3,
			column: 1,
		},
		{
			code: `a {\n\ncolor: pink;\n}`,
			fixed: `a {\n\ncolor: pink;\n\n}`,
			description: `an empty line behind the opening brace and none in front of the closing one`,
			message: messages.expected,
			line: 4,
			column: 1,
		},
		{
			code: `a { color: pink;\n\n/* comment here*/\n}`,
			fixed: `a { color: pink;\n\n/* comment here*/\n\n}`,
			description: `a comment in front of the brace, which is what the empty line has to precede`,
			message: messages.expected,
			line: 4,
			column: 1,
		},
		{
			code: `a { color: pink;\r\n\r\n/* comment here*/\r\n}`,
			fixed: `a { color: pink;\r\n\r\n/* comment here*/\r\n\r\n}`,
			description: `the same comment behind a carriage return`,
			message: messages.expected,
			line: 4,
			column: 1,
		},
		{
			code: `@media print {\n  a {\n     color: pink;\n/* comment here*/\n  }\n}`,
			fixed: `@media print {\n  a {\n     color: pink;\n/* comment here*/\n\n  }\n\n}`,
			description: `a comment closing a nested block, whose own brace has no empty line`,
			warnings: [
				{
					message: messages.expected,
					line: 5,
					column: 3,
				},
				{
					message: messages.expected,
					line: 6,
					column: 1,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\n}`,
			description: `a break in front of the brace and no empty line`,
		},
		{
			code: `a { color: pink;; ;\n}`,
			description: `stray semicolons in front of the break`,
		},
		{
			code: `a { color: pink;;\n;}`,
			description: `a stray semicolon behind the break, standing against the brace`,
		},
		{
			code: `a {color: pink;\r\n}`,
			description: `the break spelled with a carriage return`,
		},
		{
			code: `a {\ncolor: pink;\n}`,
			description: `a block broken open as well as closed`,
		},
		{
			code: `a {\r\ncolor: pink;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\n}b { color: red;\n}`,
			description: `two blocks on one line, neither with an empty line`,
		},
		{
			code: `@media print {\n  a {\n     color: pink;\n  }\n}`,
			description: `indentation standing between the break and the brace`,
		},
		{
			code: `@media print {\n\ta {\n\t\tcolor: pink;\n\t\t&:hover{\n\t\t\tcolor: red;\n\t\t\t}\n\t\t}\n}`,
			description: `three blocks nested, none closing behind an empty line`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\n\n}`,
			fixed: `a { color: pink;\n}`,
			description: `an empty line in front of the brace`,
			message: messages.rejected,
			line: 3,
			column: 1,
		},
		{
			code: `a { color: pink;\r\n\r\n}`,
			fixed: `a { color: pink;\r\n}`,
			description: `the same empty line spelled with carriage returns`,
			message: messages.rejected,
			line: 3,
			column: 1,
		},
		{
			code: `a { color: pink;\n\n }`,
			fixed: `a { color: pink;\n }`,
			description: `a space of indentation behind the empty line`,
			message: messages.rejected,
			line: 3,
			column: 2,
		},
		{
			code: `a { color: pink;\n\n\t}`,
			fixed: `a { color: pink;\n\t}`,
			description: `a tab of indentation behind the empty line`,
			message: messages.rejected,
			line: 3,
			column: 2,
		},
		{
			code: `a { color: pink;\r\n\r\n  }`,
			fixed: `a { color: pink;\r\n  }`,
			description: `a carriage return with two spaces of indentation behind it`,
			message: messages.rejected,
			line: 3,
			column: 3,
		},
		{
			code: `a { color: pink;\n\n;}`,
			fixed: `a { color: pink;\n;}`,
			description: `a stray semicolon behind the empty line`,
			message: messages.rejected,
			line: 3,
			column: 2,
		},
		{
			code: `a {\ncolor: pink;\n\n}`,
			fixed: `a {\ncolor: pink;\n}`,
			description: `a block broken open, closing behind an empty line`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
		{
			code: `a {\n\ncolor: pink;\n\n}`,
			fixed: `a {\n\ncolor: pink;\n}`,
			description: `empty lines behind the opening brace and in front of the closing one`,
			message: messages.rejected,
			line: 5,
			column: 1,
		},
		{
			code: `@media print {\n  a {\n     color: pink;\n\n  }\n\n}`,
			fixed: `@media print {\n  a {\n     color: pink;\n  }\n}`,
			description: `nested blocks, each closing behind an empty line`,
			warnings: [
				{
					message: messages.rejected,
					line: 5,
					column: 3,
				},
				{
					message: messages.rejected,
					line: 7,
					column: 1,
				},
			],
		},
		{
			code: `a {\n\ncolor: pink;\n\n/* comment here */\n\n}`,
			fixed: `a {\n\ncolor: pink;\n\n/* comment here */\n}`,
			description: `a comment behind the empty line, with the brace behind the comment`,
			message: messages.rejected,
			line: 7,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { except: [`after-closing-brace`] }],

	accept: [
		{
			code: `a {\n\tcolor: aquamarine;\n}`,
			description: `a rule at the top level, whose brace follows a declaration rather than a brace`,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a nested rule, whose closing brace follows one and so takes the empty line`,
		},
		{
			code: `a {\n\n\tb {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a rule nested in a rule, the outer brace following the inner one`,
		},
		{
			code: `a {\n\n\t@media print {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `an at-rule nested in a rule, the outer brace following the at-rule's`,
		},
		{
			code: `@font-face {\n\tfont-family: "MyFont";\n\tsrc: url("myfont.woff2") format("woff2");\n}`,
			description: `an at-rule holding declarations alone, whose brace follows no brace`,
		},
		{
			code: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a rule nested in a supports condition`,
		},
		{
			code: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a keyframe nested in a keyframes block`,
		},
	],

	reject: [
		{
			code: `a {\n\tcolor: aquamarine;\n\n}`,
			fixed: `a {\n\tcolor: aquamarine;\n}`,
			description: `an empty line in front of a brace that follows a declaration`,
			message: messages.rejected,
			line: 4,
			column: 1,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n}`,
			fixed: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a brace following a closing brace with no empty line in front of it`,
			message: messages.expected,
			line: 6,
			column: 1,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\t}\n}`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\t}\n\n}`,
			description: `the last of two nested rules closing with no empty line in front of the outer brace`,
			warnings: [
				{
					message: messages.expected,
					line: 10,
					column: 1,
				},
			],
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\n\t}\n}`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\t}\n\n}`,
			description: `an empty line in front of the inner brace, and none in front of the outer one`,
			warnings: [
				{
					message: messages.rejected,
					line: 10,
					column: 2,
				},
				{
					message: messages.expected,
					line: 11,
					column: 1,
				},
			],
		},
		{
			code: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n}`,
			fixed: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a supports condition whose brace follows a closing brace without an empty line`,
			message: messages.expected,
			line: 6,
			column: 1,
		},
		{
			code: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\t}\n}`,
			fixed: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\t}\n\n}`,
			description: `a keyframes block whose brace follows a closing brace without an empty line`,
			message: messages.expected,
			line: 6,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`, { except: [`after-closing-brace`] }],

	accept: [
		{
			code: `a {\n\tcolor: aquamarine;\n\n}`,
			description: `a rule at the top level, closing behind an empty line`,
		},
		{
			code: `a { color: aquamarine; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `a nested rule, whose outer brace follows a closing brace and so takes no empty line`,
		},
		{
			code: `@font-face {\n\tfont-family: "MyFont";\n\tsrc: url("myfont.woff2") format("woff2");\n\n}`,
			description: `an at-rule holding declarations alone, closing behind an empty line`,
		},
		{
			code: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `a rule nested in a supports condition`,
		},
		{
			code: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `a keyframe nested in a keyframes block`,
		},
	],

	reject: [
		{
			code: `a {\n\tcolor: aquamarine;\n}`,
			fixed: `a {\n\tcolor: aquamarine;\n\n}`,
			description: `a rule at the top level closing with no empty line in front of its brace`,
			message: messages.expected,
			line: 3,
			column: 1,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n\n}`,
			fixed: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `an empty line in front of a brace that follows a closing brace`,
			message: messages.rejected,
			line: 8,
			column: 1,
		},
		{
			code: `@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\n\t}\n\n}`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\n\t}\n}`,
			description: `empty lines in front of both braces, the outer one following the inner`,
			message: messages.rejected,
			line: 13,
			column: 1,
		},
		{
			code: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n\n}`,
			fixed: `@supports (animation-name: test) {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `a supports condition whose brace follows a closing brace behind an empty line`,
			message: messages.rejected,
			line: 8,
			column: 1,
		},
		{
			code: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\n\t}\n\n}`,
			fixed: `@keyframes test {\n\n\t100% {\n\t\tcolor: aquamarine;\n\n\t}\n}`,
			description: `a keyframes block whose brace follows a closing brace behind an empty line`,
			message: messages.rejected,
			line: 8,
			column: 1,
		},
	],
})
