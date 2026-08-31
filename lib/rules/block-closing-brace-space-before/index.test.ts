import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space in front of the closing brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `two blocks, each with the space in front of its brace`,
			code: `a { color: pink; } b { color: red; }`,
		},
		{
			description: `the same pair with the blocks abutting one another`,
			code: `a { color: pink; }b { color: red; }`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a space in front of the brace of a block an at-rule with neither a block nor a semicolon closes`,
			code: `a { @extend .b }`,
		},
	],

	reject: [
		{
			description: `a brace abutting the declaration`,
			code: `a { color: pink;}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.expectedBefore(),
		},
		{
			description: `two spaces where one belongs`,
			code: `a { color: pink;  }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			description: `a break where the space belongs`,
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `a tab where the space belongs`,
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore(),
		},
		{
			description: `the second of two blocks closing without the space`,
			code: `a { color: pink; } b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			line: 1,
			column: 34,
			message: messages.expectedBefore(),
		},
		{
			description: `both blocks closing without the space`,
			code: `a { color: pink;} b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedBefore(),
				},
				{
					line: 1,
					column: 33,
					message: messages.expectedBefore(),
				},
			],
		},
		{
			description: `a comment standing against the brace`,
			code: `a { color: pink;/*comment*/}`,
			fixed: `a { color: pink;/*comment*/ }`,
			line: 1,
			column: 27,
			message: messages.expectedBefore(),
		},
		{
			description: `stray semicolons standing against the brace`,
			code: `a { color: pink;;;}`,
			fixed: `a { color: pink;;; }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b }
			`,
			line: 2,
			column: 12,
			message: messages.expectedBefore(),
		},
		{
			description: `such a block with a comment the at-rule swallowed along with the whitespace, which keeps its place`,
			code: `
				a {
					@extend .b
					/* c */
				}
			`,
			fixed: `
				a {
					@extend .b
					/* c */ }
			`,
			line: 3,
			column: 9,
			message: messages.expectedBefore(),
		},
		{
			description: `the same block with that break spelled with a Windows pair, which the reported position steps back over`,
			code: `a {\n\t@extend .b\r\n}`,
			fixed: `a {\n\t@extend .b }`,
			line: 2,
			column: 12,
			message: messages.expectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			description: `a brace abutting the declaration`,
			code: `a { color: pink;}`,
		},
		{
			description: `two blocks, neither with a space in front of its brace`,
			code: `a { color: pink;} b { color: red;}`,
		},
		{
			description: `the same pair abutting one another`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a brace abutting an at-rule with neither a block nor a semicolon, which closes the block`,
			code: `a { @extend .b}`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 18,
			message: messages.rejectedBefore(),
		},
		{
			description: `a break in front of the brace`,
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBefore(),
		},
		{
			description: `the second of two blocks closing behind a space`,
			code: `a { color: pink;} b { color: red; }`,
			fixed: `a { color: pink;} b { color: red;}`,
			line: 1,
			column: 34,
			message: messages.rejectedBefore(),
		},
		{
			description: `both blocks closing behind a space`,
			code: `a { color: pink; } b { color: red; }`,
			fixed: `a { color: pink;} b { color: red;}`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.rejectedBefore(),
				},
				{
					line: 1,
					column: 35,
					message: messages.rejectedBefore(),
				},
			],
		},
		{
			description: `a comment behind a space, with the brace behind the comment`,
			code: `a { color: pink; /*comment*/ }`,
			fixed: `a { color: pink; /*comment*/}`,
			line: 1,
			column: 29,
			message: messages.rejectedBefore(),
		},
		{
			description: `spaces standing around the stray semicolons`,
			code: `a { color: pink ; ; ; }`,
			fixed: `a { color: pink ; ; ;}`,
			line: 1,
			column: 22,
			message: messages.rejectedBefore(),
		},
		{
			description: `a double slash at the end of a value of plain CSS, which opens no comment and leaves the brace somewhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c}
			`,
			line: 2,
			column: 18,
			message: messages.rejectedBefore(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a space in front of the brace of a block an at-rule with neither a block nor a semicolon closes`,
			code: `a { @extend .b }`,
			fixed: `a { @extend .b}`,
			line: 1,
			column: 15,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same block written over three lines, so the whitespace the parser files into the at-rule holds a break`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b}
			`,
			line: 2,
			column: 12,
			message: messages.rejectedBefore(),
		},
		{
			description: `such a block with a comment the at-rule swallowed along with the whitespace, which keeps its place`,
			code: `
				a {
					@extend .b
					/* c */
				}
			`,
			fixed: `
				a {
					@extend .b
					/* c */}
			`,
			line: 3,
			column: 9,
			message: messages.rejectedBefore(),
		},
		{
			description: `the same block with that break spelled with a Windows pair, which the reported position steps back over`,
			code: `a {\n\t@extend .b\r\n}`,
			fixed: `a {\n\t@extend .b}`,
			line: 2,
			column: 12,
			message: messages.rejectedBefore(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-single-line`],

	accept: [
		{
			description: `a single-line block with the space in front of its brace`,
			code: `a { color: pink; }`,
		},
		{
			description: `two single-line blocks, each with the space`,
			code: `a { color: pink; } b { color: red; }`,
		},
		{
			description: `the same pair abutting one another`,
			code: `a { color: pink; }b { color: red; }`,
		},
		{
			description: `a rule broken across lines whose block is single-line all the same`,
			code: `a,\nb { color: pink; } c { color: red; }`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color: pink;\ntop: 0;}`,
		},
		{
			description: `an empty line inside the block, which makes it multi-line`,
			code: `
				a { color: pink;

				top: 0;}
			`,
		},
		{
			description: `two spaces in front of the brace of a multi-line block`,
			code: `a { color: pink;\ntop: 0;  } b { color: red; }`,
		},
		{
			description: `a break in front of the brace of a multi-line block`,
			code: `
				a { color: pink;
				top: 0;
				}b { color: red; }
			`,
		},
	],

	reject: [
		{
			description: `a single-line block closing against its declaration`,
			code: `a { color: pink;}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 16,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink;}`,
			fixed: `a,\nb { color: pink; }`,
			line: 2,
			column: 16,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink;}`,
			fixed: `a,\r\nb { color: pink; }`,
			line: 2,
			column: 16,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;  }`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 18,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink; }`,
			line: 1,
			column: 17,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			description: `the second of two single-line blocks closing without the space`,
			code: `a { color: pink; } b { color: red;}`,
			fixed: `a { color: pink; } b { color: red; }`,
			line: 1,
			column: 34,
			message: messages.expectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a brace abutting an at-rule with neither a block nor a semicolon, which closes a single-line block`,
			code: `a { @extend .b}`,
			fixed: `a { @extend .b }`,
			line: 1,
			column: 14,
			message: messages.expectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-single-line`],

	accept: [
		{
			description: `a single-line block closing against its declaration`,
			code: `a { color: pink;}`,
		},
		{
			description: `two single-line blocks, neither with a space`,
			code: `a { color: pink;} b { color: red;}`,
		},
		{
			description: `the same pair abutting one another`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			description: `a rule broken across lines whose block is single-line all the same`,
			code: `a,\nb { color: pink;} b { color: red;}`,
		},
		{
			description: `a multi-line block, which this option passes over`,
			code: `a { color: pink;\ntop: 0; }`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0; }`,
		},
		{
			description: `two spaces in front of the brace of a multi-line block`,
			code: `a { color: pink;\ntop: 0;  } b { color: red;}`,
		},
		{
			description: `a break in front of the brace of a multi-line block`,
			code: `
				a { color: pink;
				top: 0;
				}b { color: red;}
			`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a single-line block`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same block under a selector broken across lines`,
			code: `a,\nb { color: pink; }`,
			fixed: `a,\nb { color: pink;}`,
			line: 2,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `the same selector broken with a carriage return`,
			code: `a,\r\nb { color: pink; }`,
			fixed: `a,\r\nb { color: pink;}`,
			line: 2,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 18,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;}`,
			line: 1,
			column: 17,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `a tab in front of the second block's brace`,
			code: `a { color: pink;} b { color: red;\t}`,
			fixed: `a { color: pink;} b { color: red;}`,
			line: 1,
			column: 34,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			description: `two spaces in front of the first block's brace`,
			code: `a { color: pink;  } b { color: red;}`,
			fixed: `a { color: pink;} b { color: red;}`,
			line: 1,
			column: 18,
			message: messages.rejectedBeforeSingleLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a space in front of the brace of a single-line block an at-rule with neither a block nor a semicolon closes`,
			code: `a { @extend .b }`,
			fixed: `a { @extend .b}`,
			line: 1,
			column: 15,
			message: messages.rejectedBeforeSingleLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block with the space in front of its brace`,
			code: `a { color: pink;\ntop: 0; }`,
		},
		{
			description: `two blocks, the first multi-line, each with the space`,
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
		},
		{
			description: `the same pair abutting one another`,
			code: `a { color: pink;\ntop: 0; }b { color: red; }`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0; }b { color: red; }`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink;}`,
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a { color: pink;  } b { color: red; }`,
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a { color: pink;\t}b { color: red; }`,
		},
	],

	reject: [
		{
			description: `a multi-line block closing against its declaration`,
			code: `a { color: pink;\ntop: 0;}`,
			fixed: `a { color: pink;\ntop: 0; }`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0; }`,
			line: 2,
			column: 9,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0; }`,
			line: 2,
			column: 8,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the second of two blocks, multi-line, closing without the space`,
			code: `a { color: pink; } b { color: red;\ntop: 0;}`,
			fixed: `a { color: pink; } b { color: red;\ntop: 0; }`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the first of two blocks, multi-line, closing without the space`,
			code: `a { color: pink;\ntop: 0;} b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0; } b { color: red; }`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;} b { color: red; }`,
			fixed: `a { color: pink;\r\ntop: 0; } b { color: red; }`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a break in front of the brace of a block an at-rule with neither a block nor a semicolon closes`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b }
			`,
			line: 2,
			column: 12,
			message: messages.expectedBeforeMultiLine(),
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block closing against its declaration`,
			code: `a { color: pink;\ntop: 0;}`,
		},
		{
			description: `two blocks, the first multi-line, neither with a space`,
			code: `a { color: pink;\ntop: 0;} b { color: red;}`,
		},
		{
			description: `the same pair spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;} b { color: red;}`,
		},
		{
			description: `the same pair abutting one another`,
			code: `a { color: pink;\ntop: 0;}b { color: red;}`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a { color: pink;  } b { color: red; }`,
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a { color: pink;\t}b { color: red; }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a multi-line block`,
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 9,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;\t}`,
			fixed: `a { color: pink;\r\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the second of two blocks, multi-line, closing behind a space`,
			code: `a { color: pink; } b { color: red;\ntop: 0; }`,
			fixed: `a { color: pink; } b { color: red;\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			description: `the first of two blocks, multi-line, closing behind a space`,
			code: `a { color: pink;\ntop: 0; } b { color: red; }`,
			fixed: `a { color: pink;\ntop: 0;} b { color: red; }`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine(),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a break in front of the brace of a block an at-rule with neither a block nor a semicolon closes`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b}
			`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine(),
		},
	],
})
