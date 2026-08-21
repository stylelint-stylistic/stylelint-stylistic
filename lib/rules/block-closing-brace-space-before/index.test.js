import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a space in front of the closing brace`,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			description: `two blocks, each with the space in front of its brace`,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `the same pair with the blocks abutting one another`,
		},
	],

	reject: [
		{
			code: `a { color: pink;}`,
			fixed: `a { color: pink; }`,
			description: `a brace abutting the declaration`,
			message: messages.expectedBefore(),
			line: 1,
			column: 16,
		},
		{
			code: `a { color: pink;  }`,
			fixed: `a { color: pink; }`,
			description: `two spaces where one belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink; }`,
			description: `a break where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink; }`,
			description: `the same break spelled with a carriage return`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink; }`,
			description: `a tab where the space belongs`,
			message: messages.expectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; } b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			description: `the second of two blocks closing without the space`,
			message: messages.expectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			description: `both blocks closing without the space`,
			warnings: [
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 16,
				},
				{
					message: messages.expectedBefore(),
					line: 1,
					column: 33,
				},
			],
		},
		{
			code: `a { color: pink;/*comment*/}`,
			fixed: `a { color: pink;/*comment*/ }`,
			description: `a comment standing against the brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 27,
		},
		{
			code: `a { color: pink;;;}`,
			fixed: `a { color: pink;;; }`,
			description: `stray semicolons standing against the brace`,
			message: messages.expectedBefore(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `a { color: pink;}`,
			description: `a brace abutting the declaration`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `two blocks, neither with a space in front of its brace`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `the same pair abutting one another`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink;}`,
			description: `a space in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;}`,
			description: `two spaces in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink;}`,
			description: `a break in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink;}`,
			description: `the same break spelled with a carriage return`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;}`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;} b { color: red; }`,
			fixed: `a { color: pink;} b { color: red;}`,
			description: `the second of two blocks closing behind a space`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 34,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink;} b { color: red;}`,
			description: `both blocks closing behind a space`,
			warnings: [
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 17,
				},
				{
					message: messages.rejectedBefore(),
					line: 1,
					column: 35,
				},
			],
		},
		{
			code: `a { color: pink; /*comment*/ }`,
			fixed: `a { color: pink; /*comment*/}`,
			description: `a comment behind a space, with the brace behind the comment`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 29,
		},
		{
			code: `a { color: pink ; ; ; }`,
			fixed: `a { color: pink ; ; ;}`,
			description: `spaces standing around the stray semicolons`,
			message: messages.rejectedBefore(),
			line: 1,
			column: 22,
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			code: `a { color: pink; }`,
			description: `a single-line block with the space in front of its brace`,
		},
		{
			code: `a { color: pink; } b { color: red; }`,
			description: `two single-line blocks, each with the space`,
		},
		{
			code: `a { color: pink; }b { color: red; }`,
			description: `the same pair abutting one another`,
		},
		{
			code: `a,\nb { color: pink; } c { color: red; }`,
			description: `a rule broken across lines whose block is single-line all the same`,
		},
		{
			code: `a { color: pink;\ntop: 0;}`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `
				a { color: pink;

				top: 0;}
			`,
			description: `an empty line inside the block, which makes it multi-line`,
		},
		{
			code: `a { color: pink;\ntop: 0;  } b { color: red; }`,
			description: `two spaces in front of the brace of a multi-line block`,
		},
		{
			code: `
				a { color: pink;
				top: 0;
				}b { color: red; }
			`,
			description: `a break in front of the brace of a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;}`,
			fixed: `a { color: pink; }`,
			description: `a single-line block closing against its declaration`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 16,
		},
		{
			code: `a,\nb { color: pink;}`,
			fixed: `a,\nb { color: pink; }`,
			description: `the same block under a selector broken across lines`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a,\r\nb { color: pink;}`,
			fixed: `a,\r\nb { color: pink; }`,
			description: `the same selector broken with a carriage return`,
			message: messages.expectedBeforeSingleLine(),
			line: 2,
			column: 16,
		},
		{
			code: `a { color: pink;  }`,
			fixed: `a { color: pink; }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink; }`,
			description: `a tab in front of the brace`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; } b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			description: `the second of two single-line blocks closing without the space`,
			message: messages.expectedBeforeSingleLine(),
			line: 1,
			column: 34,
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			code: `a { color: pink;}`,
			description: `a single-line block closing against its declaration`,
		},
		{
			code: `a { color: pink;} b { color: red;}`,
			description: `two single-line blocks, neither with a space`,
		},
		{
			code: `a { color: pink;}b { color: red;}`,
			description: `the same pair abutting one another`,
		},
		{
			code: `a,\nb { color: pink;} b { color: red;}`,
			description: `a rule broken across lines whose block is single-line all the same`,
		},
		{
			code: `a { color: pink;\ntop: 0; }`,
			description: `a multi-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }`,
			description: `the same block spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\ntop: 0;  } b { color: red;}`,
			description: `two spaces in front of the brace of a multi-line block`,
		},
		{
			code: `
				a { color: pink;
				top: 0;
				}b { color: red;}
			`,
			description: `a break in front of the brace of a multi-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink; }`,
			fixed: `a { color: pink;}`,
			description: `a space in front of the brace of a single-line block`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a,\nb { color: pink; }`,
			fixed: `a,\nb { color: pink;}`,
			description: `the same block under a selector broken across lines`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a,\r\nb { color: pink; }`,
			fixed: `a,\r\nb { color: pink;}`,
			description: `the same selector broken with a carriage return`,
			message: messages.rejectedBeforeSingleLine(),
			line: 2,
			column: 17,
		},
		{
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;}`,
			description: `two spaces in front of the brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 18,
		},
		{
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;}`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink;} b { color: red;\t}`,
			fixed: `a { color: pink;} b { color: red;}`,
			description: `a tab in front of the second block's brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 34,
		},
		{
			code: `a { color: pink;  } b { color: red;}`,
			fixed: `a { color: pink;} b { color: red;}`,
			description: `two spaces in front of the first block's brace`,
			message: messages.rejectedBeforeSingleLine(),
			line: 1,
			column: 18,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			code: `a { color: pink;\ntop: 0; }`,
			description: `a multi-line block with the space in front of its brace`,
		},
		{
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			description: `two blocks, the first multi-line, each with the space`,
		},
		{
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
			description: `the same pair abutting one another`,
		},
		{
			code: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `a { color: pink;}`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;  } b { color: red; }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
		{
			code: `a { color: pink;\t}b { color: red; }`,
			description: `a tab in front of the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0;}`,
			fixed: `a { color: pink;\ntop: 0; }`,
			description: `a multi-line block closing against its declaration`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 7,
		},
		{
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0; }`,
			description: `two spaces in front of the brace`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0; }`,
			description: `a tab in front of the brace`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink; } b { color: red;\ntop: 0;}`,
			fixed: `a { color: pink; } b { color: red;\ntop: 0; }`,
			description: `the second of two blocks, multi-line, closing without the space`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 7,
		},
		{
			code: `a { color: pink;\ntop: 0;} b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; } b { color: red; }`,
			description: `the first of two blocks, multi-line, closing without the space`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 7,
		},
		{
			code: `a { color: pink;\r\ntop: 0;} b { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; } b { color: red; }`,
			description: `the same pair spelled with a carriage return`,
			message: messages.expectedBeforeMultiLine(),
			line: 2,
			column: 7,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			code: `a { color: pink;\ntop: 0;}`,
			description: `a multi-line block closing against its declaration`,
		},
		{
			code: `a { color: pink;\ntop: 0;} b { color: red;}`,
			description: `two blocks, the first multi-line, neither with a space`,
		},
		{
			code: `a { color: pink;\r\ntop: 0;} b { color: red;}`,
			description: `the same pair spelled with a carriage return`,
		},
		{
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
			description: `the same pair abutting one another`,
		},
		{
			code: `a { color: pink; }`,
			description: `a single-line block, which this option passes over`,
		},
		{
			code: `a { color: pink;  } b { color: red; }`,
			description: `two spaces in front of the brace of a single-line block`,
		},
		{
			code: `a { color: pink;\t}b { color: red; }`,
			description: `a tab in front of the brace of a single-line block`,
		},
	],

	reject: [
		{
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `a space in front of the brace of a multi-line block`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `two spaces in front of the brace`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 9,
		},
		{
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;}`,
			description: `a tab in front of the brace`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\r\ntop: 0;\t}`,
			fixed: `a { color: pink;\r\ntop: 0;}`,
			description: `the same block spelled with a carriage return`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink; } b { color: red;\ntop: 0; }`,
			fixed: `a { color: pink; } b { color: red;\ntop: 0;}`,
			description: `the second of two blocks, multi-line, closing behind a space`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
		{
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0;} b { color: red; }`,
			description: `the first of two blocks, multi-line, closing behind a space`,
			message: messages.rejectedBeforeMultiLine(),
			line: 2,
			column: 8,
		},
	],
})
