import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a break in front of the closing brace`,
			code: `a { color: pink;\n}`,
		},
		{
			description: `a stray semicolon in front of the break`,
			code: `a { color: pink;;\n}`,
		},
		{
			description: `two stray semicolons in front of the break`,
			code: `a { color: pink;;;\n}`,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\n}`,
		},
		{
			description: `an empty line in front of the brace, which is a break all the same`,
			code: `
				a { color: pink;

				}
			`,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { color: pink;\r\n\r\n}`,
		},
		{
			description: `indentation between the break and the brace`,
			code: `a { color: pink;\n\t\t}`,
		},
		{
			description: `two blocks, each broken in front of its brace`,
			code: `
				a { color: pink;
				} b { color: red;
				}
			`,
		},
		{
			description: `the same pair with the second block abutting the first`,
			code: `
				a { color: pink;
				}b { color: red;
				}
			`,
		},
		{
			description: `nested blocks, each broken in front of its brace, with indentation behind the break`,
			code: `
				@media print {
				  a {
				     color: pink;
				  }
				}
			`,
		},
		{
			description: `three blocks nested the same way`,
			code: `
				@media print {
					a {
						color: pink;
						{
							&:hover;
							}
						}
				}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b
				}
			`,
		},
		{
			description: `such a block with a comment the at-rule swallowed along with the whitespace`,
			code: `
				a {
					@extend .b
					/* c */
				}
			`,
		},
	],

	reject: [
		{
			description: `a brace abutting the declaration`,
			code: `a { color: pink;}`,
			fixed: `a { color: pink;\n}`,
			line: 1,
			column: 16,
			message: messages.expectedBefore,
		},
		{
			description: `a brace abutting a stray semicolon`,
			code: `a { color: pink;;}`,
			fixed: `a { color: pink;;\n}`,
			line: 1,
			column: 17,
			message: messages.expectedBefore,
		},
		{
			description: `a space in front of the brace`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink;\n }`,
			line: 1,
			column: 17,
			message: messages.expectedBefore,
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore,
		},
		{
			description: `the same trailing space in front of a carriage return`,
			code: `a { color: pink; \r\n}`,
			fixed: `a { color: pink;\r\n}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore,
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;  }`,
			fixed: `a { color: pink;\n  }`,
			line: 1,
			column: 18,
			message: messages.expectedBefore,
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\t}`,
			fixed: `a { color: pink;\n\t}`,
			line: 1,
			column: 17,
			message: messages.expectedBefore,
		},
		{
			description: `two blocks, the second closing on a space where the break belongs`,
			code: `a { color: pink;\n} b { color: red; }`,
			fixed: `a { color: pink;\n} b { color: red;\n }`,
			line: 2,
			column: 18,
			message: messages.expectedBefore,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a space in front of the brace of a single-line block an at-rule with neither a block nor a semicolon closes`,
			code: `a { @extend .b }`,
			fixed: `a { @extend .b\n }`,
			line: 1,
			column: 15,
			message: messages.expectedBefore,
		},
		{
			description: `the same block with the brace abutting the at-rule`,
			code: `a { @extend .b}`,
			fixed: `a { @extend .b\n}`,
			line: 1,
			column: 14,
			message: messages.expectedBefore,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a multi-line block broken in front of its brace`,
			code: `
				a { color: pink;
				top: 0;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0;\r\n}`,
		},
		{
			description: `stray semicolons behind each declaration`,
			code: `
				a { color: pink;;
				top: 0;;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a { color: pink;;\r\ntop: 0;;\r\n}`,
		},
		{
			description: `two stray semicolons behind each declaration`,
			code: `
				a { color: pink;;;
				top: 0;;;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a { color: pink;;;\r\ntop: 0;;;\r\n}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/209
			description: `a form feed on either side of the declaration, which is whitespace and no line break, so the block is single-line and none of this option's business`,
			code: `a {\fcolor: pink;\f}`,
		},
		{
			description: `indentation between the break and the brace`,
			code: `
				a { color: pink;
				top: 0;
						}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a { color: pink;\r\ntop: 0;\r\n\t\t}`,
		},
		{
			description: `two multi-line blocks, each broken in front of its brace`,
			code: `
				a { color: pink;
				top: 0;
				} b { color: red;
				}
			`,
		},
		{
			description: `the same pair with the second block abutting the first`,
			code: `
				a { color: pink;
				top: 0;
				}b { color: red;
				}
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink;}`,
		},
		{
			description: `a stray semicolon in a single-line block`,
			code: `a { color: pink;;}`,
		},
		{
			description: `two stray semicolons in a single-line block`,
			code: `a { color: pink;;;}`,
		},
		{
			description: `two single-line blocks separated by a space`,
			code: `a { color: pink;} b { color: red;}`,
		},
		{
			description: `two single-line blocks abutting one another`,
			code: `a { color: pink;}b { color: red;}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b
				}
			`,
		},
	],

	reject: [
		{
			description: `a multi-line block whose brace abuts the last declaration`,
			code: `a { color: pink;\ntop: 0;}`,
			fixed: `a { color: pink;\ntop: 0;\n}`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;}`,
			fixed: `a { color: pink;\r\ntop: 0;\r\n}`,
			line: 2,
			column: 7,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a stray semicolon standing against the brace`,
			code: `a { color: pink;;\ntop: 0;;}`,
			fixed: `a { color: pink;;\ntop: 0;;\n}`,
			line: 2,
			column: 8,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;\r\ntop: 0;;}`,
			fixed: `a { color: pink;;\r\ntop: 0;;\r\n}`,
			line: 2,
			column: 8,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `two stray semicolons standing against the brace`,
			code: `a { color: pink;;;\ntop: 0;;;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;\n}`,
			line: 2,
			column: 9,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;;\r\ntop: 0;;;}`,
			fixed: `a { color: pink;;;\r\ntop: 0;;;\r\n}`,
			line: 2,
			column: 9,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a space in front of the brace of a multi-line block`,
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;\n }`,
			line: 2,
			column: 8,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a space in front of the break, which is what the fix trims`,
			code: `a { color: pink;\ntop: 0; \n}`,
			fixed: `a { color: pink;\ntop: 0;\n}`,
			line: 2,
			column: 9,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;\n  }`,
			line: 2,
			column: 9,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;\n\t}`,
			line: 2,
			column: 8,
			message: messages.expectedBeforeMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],

	accept: [
		{
			description: `a multi-line block whose brace abuts the last declaration`,
			code: `a { color: pink;\ntop: 0;}`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0;}`,
		},
		{
			description: `a stray semicolon standing against the brace`,
			code: `a { color: pink;;\ntop: 0;;}`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;\r\ntop: 0;;}`,
		},
		{
			description: `two stray semicolons standing against the brace`,
			code: `a { color: pink;;;\ntop: 0;;;}`,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;;\r\ntop: 0;;;}`,
		},
		{
			description: `two multi-line blocks, each closing against its last declaration`,
			code: `
				a { color: pink;
				top: 0;} b { color: red;
				top: 0;}
			`,
		},
		{
			description: `the same pair with the second block abutting the first`,
			code: `
				a { color: pink;
				top: 0;}b { color: red;
				top: 0;}
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a tab in front of the brace of a single-line block`,
			code: `a { color: pink;\t}`,
		},
		{
			description: `two spaces in front of the brace of a single-line block`,
			code: `a { color: pink;  }`,
		},
	],

	reject: [
		{
			description: `a space in front of the brace of a multi-line block`,
			code: `a { color: pink;\ntop: 0; }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;\r\ntop: 0; }`,
			fixed: `a { color: pink;\r\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a space behind a stray semicolon`,
			code: `a { color: pink;;\ntop: 0;; }`,
			fixed: `a { color: pink;;\ntop: 0;;}`,
			line: 2,
			column: 9,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;\r\ntop: 0;; }`,
			fixed: `a { color: pink;;\r\ntop: 0;;}`,
			line: 2,
			column: 9,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a space behind two stray semicolons`,
			code: `a { color: pink;;;\ntop: 0;;; }`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			line: 2,
			column: 10,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block spelled with a carriage return`,
			code: `a { color: pink;;;\r\ntop: 0;;; }`,
			fixed: `a { color: pink;;;\r\ntop: 0;;;}`,
			line: 2,
			column: 10,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a break in front of the brace`,
			code: `
				a { color: pink;
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				top: 0;}
			`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `two spaces in front of the brace`,
			code: `a { color: pink;\ntop: 0;  }`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 9,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a tab in front of the brace`,
			code: `a { color: pink;\ntop: 0;\t}`,
			fixed: `a { color: pink;\ntop: 0;}`,
			line: 2,
			column: 8,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `two blocks, the second broken in front of its brace`,
			code: `
				a { color: pink;
				top: 0;} b { color: red;
				top: 0;
				}
			`,
			fixed: `
				a { color: pink;
				top: 0;} b { color: red;
				top: 0;}
			`,
			line: 3,
			column: 8,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a space standing between two stray semicolons`,
			code: `a { color: pink;;;\ntop: 0; ;;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			line: 2,
			column: 10,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a space standing in front of the last stray semicolon`,
			code: `a { color: pink;;;\ntop: 0;; ;}`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			line: 2,
			column: 10,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `spaces standing around both stray semicolons`,
			code: `a { color: pink;;;\ntop: 0; ; ; }`,
			fixed: `a { color: pink;;;\ntop: 0;;;}`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine,
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
			message: messages.rejectedBeforeMultiLine,
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
					@extend .b}
			`,
			line: 2,
			column: 12,
			message: messages.rejectedBeforeMultiLine,
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
			message: messages.rejectedBeforeMultiLine,
		},
	],
})
