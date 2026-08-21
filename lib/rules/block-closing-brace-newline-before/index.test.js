import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink;\n}`,
			description: `a break in front of the closing brace`,
		},
		{
			code: `a { color: pink;;\n}`,
			description: `a stray semicolon in front of the break`,
		},
		{
			code: `a { color: pink;;;\n}`,
			description: `two stray semicolons in front of the break`,
		},
		{
			code: `a { color: pink;\r\n}`,
			description: `the same break spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\n\n}`,
			description: `an empty line in front of the brace, which is a break all the same`,
		},
		{
			code: `a { color: pink;\r\n\r\n}`,
			description: `the same empty line spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\n\t\t}`,
			description: `indentation between the break and the brace`,
		},
		{
			code: `a { color: pink;\n} b { color: red;\n}`,
			description: `two blocks, each broken in front of its brace`,
		},
		{
			code: `a { color: pink;\n}b { color: red;\n}`,
			description: `the same pair with the second block abutting the first`,
		},
		{
			code: `@media print {\n  a {\n     color: pink;\n  }\n}`,
			description: `nested blocks, each broken in front of its brace, with indentation behind the break`,
		},
		{
			code: `@media print {\n\ta {\n\t\tcolor: pink;\n\t\t{\n\t\t\t&:hover;\n\t\t\t}\n\t\t}\n}`,
			description: `three blocks nested the same way`,
		},
	],

	reject: [
		{
			code: `a { color: pink;}`,
			fixed: `a { color: pink;\n}`,
			description: `a brace abutting the declaration`,
			message: messages.expectedBefore,
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink;;}`,
			fixed: `a { color: pink;;\n}`,
			description: `a brace abutting a stray semicolon`,
			message: messages.expectedBefore,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink;\n }`,
			description: `a space in front of the brace`,
			message: messages.expectedBefore,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			description: `a space in front of the break, which is what the fix trims`,
			message: messages.expectedBefore,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink; \r\n}`,
			fixed: `a { color: pink;\r\n}`,
			description: `the same trailing space in front of a carriage return`,
			message: messages.expectedBefore,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;\n  }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBefore,
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;\n\t}`,
			description: `a tab in front of the brace`,
			message: messages.expectedBefore,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\n} b { color: red; }`,
			fixed: `a { color: pink;\n} b { color: red;\n }`,
			description: `two blocks, the second closing on a space where the break belongs`,
			message: messages.expectedBefore,
			line: 2,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink;\ntop: 0;\n}`,
			description: `a multi-line block broken in front of its brace`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;;\ntop: 0;;\n}`,
			description: `stray semicolons behind each declaration`,
		},
		{
			code: `a { color: pink;;\r\ntop: 0;;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;;;\ntop: 0;;;\n}`,
			description: `two stray semicolons behind each declaration`,
		},
		{
			code: `a { color: pink;;;\r\ntop: 0;;;\r\n}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\ntop: 0;\n\t\t}`,
			description: `indentation between the break and the brace`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;\r\n\t\t}`,
			description: `the same block spelled with carriage returns`,
		},
		{
			code: `a { color: pink;\ntop: 0;\n} b { color: red;\n}`,
			description: `two multi-line blocks, each broken in front of its brace`,
		},
		{
			code: `a { color: pink;\ntop: 0;\n}b { color: red;\n}`,
			description: `the same pair with the second block abutting the first`,
		},
		{
			code: `a { color: pink;}`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;;}`,
			description: `a stray semicolon in a single-line block`,
		},
		{
			code: `a { color: pink;;;}`,
			description: `two stray semicolons in a single-line block`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `two single-line blocks separated by a space`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `two single-line blocks abutting one another`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0;}`,
			fixed: `a { color: pink;\ntop: 0;\n}`,
			description: `a multi-line block whose brace abuts the last declaration`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 7,
		},
		{
			code: `a { color: pink;\r\ntop: 0;}`,
			fixed: `a { color: pink;\r\ntop: 0;\r\n}`,
			description: `the same block spelled with a carriage return`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 7,
		},
		{
			code: `a { color: pink;;\ntop: 0;;}`,
			fixed: `a { color: pink;;\ntop: 0;;\n}`,
			description: `a stray semicolon standing against the brace`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;;\r\ntop: 0;;}`,
			fixed: `a { color: pink;;\r\ntop: 0;;\r\n}`,
			description: `the same block spelled with a carriage return`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;;;\ntop: 0;;;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;\n}`,
			description: `two stray semicolons standing against the brace`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;;;\r\ntop: 0;;;}`,
			fixed: `a { color: pink;;;\r\ntop: 0;;;\r\n}`,
			description: `the same block spelled with a carriage return`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;\n }`,
			description: `a space in front of the brace of a multi-line block`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\ntop: 0; \n}`,
			fixed: `a { color: pink;\ntop: 0;\n}`,
			description: `a space in front of the break, which is what the fix trims`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;\n  }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;\n\t}`,
			description: `a tab in front of the brace`,
			message: messages.expectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a { color: pink;\ntop: 0;}`,
			description: `a multi-line block whose brace abuts the last declaration`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;}`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;;\ntop: 0;;}`,
			description: `a stray semicolon standing against the brace`,
		},
		{
			code: `a { color: pink;;\r\ntop: 0;;}`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;;;\ntop: 0;;;}`,
			description: `two stray semicolons standing against the brace`,
		},
		{
			code: `a { color: pink;;;\r\ntop: 0;;;}`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\ntop: 0;} b { color: red;\ntop: 0;}`,
			description: `two multi-line blocks, each closing against its last declaration`,
		},
		{
			code: `a { color: pink;\ntop: 0;}b { color: red;\ntop: 0;}`,
			description: `the same pair with the second block abutting the first`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\t}`,
			description: `a tab in front of the brace of a single-line block`,
		},
		{
			code: `a { color: pink;  }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `a space in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }`,
			fixed: `a { color: pink;\r\ntop: 0;}`,
			description: `the same block spelled with a carriage return`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;;\ntop: 0;; }`,
			fixed: `a { color: pink;;\ntop: 0;;}`,
			description: `a space behind a stray semicolon`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;;\r\ntop: 0;; }`,
			fixed: `a { color: pink;;\r\ntop: 0;;}`,
			description: `the same block spelled with a carriage return`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;;;\ntop: 0;;; }`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			description: `a space behind two stray semicolons`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;;;\r\ntop: 0;;; }`,
			fixed: `a { color: pink;;;\r\ntop: 0;;;}`,
			description: `the same block spelled with a carriage return`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;\ntop: 0;\n}`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `a break in front of the brace`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `two spaces in front of the brace`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\ntop: 0;} b { color: red;\ntop: 0;\n}`,
			fixed: `a { color: pink;\ntop: 0;} b { color: red;\ntop: 0;}`,
			description: `two blocks, the second broken in front of its brace`,
			message: messages.rejectedBeforeMultiLine,
			line: 3,
			column: 8,
		},
		{
			code: `a { color: pink;;;\ntop: 0; ;;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			description: `a space standing between two stray semicolons`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;;;\ntop: 0;; ;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			description: `a space standing in front of the last stray semicolon`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 10,
		},
		{
			code: `a { color: pink;;;\ntop: 0; ; ; }`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			description: `spaces standing around both stray semicolons`,
			message: messages.rejectedBeforeMultiLine,
			line: 2,
			column: 12,
		},
	],
})
