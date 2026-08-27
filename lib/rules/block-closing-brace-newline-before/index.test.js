import { messages, ruleName } from "./index.js"

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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/209
			description: `a bare carriage return, which is the very break this option asks for`,
			code: `a { color: pink;\r}`,
		},
		{
			description: `a bare form feed, which ends a line to every syntax this plugin reads through`,
			code: `a { color: pink;\f}`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/209
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			code: `a { color: pink;  \r}`,
			fixed: `a { color: pink;\r}`,
			line: 1,
			column: 19,
			message: messages.expectedBefore,
		},
		{
			description: `the same spaces in front of a form feed`,
			code: `a { color: pink;  \f}`,
			fixed: `a { color: pink;\f}`,
			line: 1,
			column: 19,
			message: messages.expectedBefore,
		},
		{
			description: `a tab in front of a bare carriage return`,
			code: `a { color: pink;\t\r}`,
			fixed: `a { color: pink;\r}`,
			line: 1,
			column: 18,
			message: messages.expectedBefore,
		},
		{
			description: `a tab in front of a form feed`,
			code: `a { color: pink;\t\f}`,
			fixed: `a { color: pink;\f}`,
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
			description: `a bare carriage return in front of the brace, the same break opening the block`,
			code: `a {\r  color: pink;\r}`,
		},
		{
			description: `a form feed in front of the brace of a block a line feed makes multi-line`,
			code: `a {\n  color: pink;\f}`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/209
			description: `spaces in front of a bare carriage return, which the fix trims up to the break rather than writing a line feed in front of them`,
			code: `a {\r  color: pink;  \r}`,
			fixed: `a {\r  color: pink;\r}`,
			line: 1,
			column: 21,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `the same spaces in front of a form feed, the block made multi-line by a line feed`,
			code: `a {\n  color: pink;  \f}`,
			fixed: `a {\n  color: pink;\f}`,
			line: 2,
			column: 17,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a tab in front of a bare carriage return`,
			code: `a {\r  color: pink;\t\r}`,
			fixed: `a {\r  color: pink;\r}`,
			line: 1,
			column: 20,
			message: messages.expectedBeforeMultiLine,
		},
		{
			description: `a tab in front of a form feed`,
			code: `a {\n  color: pink;\t\f}`,
			fixed: `a {\n  color: pink;\f}`,
			line: 2,
			column: 16,
			message: messages.expectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a block whose every break is a form feed, which makes it multi-line like any other break`,
			code: `a {\fcolor: pink;  \f}`,
			fixed: `a {\fcolor: pink;\f}`,
			line: 1,
			column: 19,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/244
			description: `a block whose every break is a form feed, which makes it multi-line like any other break`,
			code: `a {\fcolor: pink; \f}`,
			fixed: `a {\fcolor: pink;}`,
			line: 1,
			column: 18,
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

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/231
			// Neither the line nor the column is asserted in the fixtures below: this rule counts the position off the statement PostCSS prints, and wherever an inline comment stands in one, that is not the statement the file spells — a measurement #139 is about rather than this one.
			description: `a block whose last declaration carries an inline comment behind its value, so the brace has nowhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with the comment standing on a line of its own`,
			code: `
				a {
					color: pink;
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a stray semicolon behind such a comment, which the option takes away along with every break of the raw`,
			code: `
				a {
					color: pink;
					// c
				;
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				;
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, which this option never reaches, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a block an at-rule with neither a block nor a semicolon closes, an inline comment standing behind that at-rule, so the brace has nowhere to go`,
			code: `
				a {
					@extend .b
					// c
				}
			`,
			fixed: `
				a {
					@extend .b
					// c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
			description: `a form feed closing the comment, which Sass reads a line in: the brace stands in code behind it and the whitespace in front of it goes`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px;}`,
			line: 1,
			column: 24,
			message: messages.rejectedBeforeMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`never-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a block whose last declaration carries an inline comment behind its value, so the brace has nowhere to go`,
			code: `
				a {
					color: pink // c
				}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with the comment standing on a line of its own`,
			code: `
				a {
					color: pink;
					// c
				}
			`,
			fixed: `
				a {
					color: pink;
					// c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `a comment closed by the break of the whitespace its own declaration ends with, which this option never reaches, behind which the semicolon stands on a line of its own`,
			code: `
				a {
					color: pink // c
					;
				}
			`,
			fixed: `
				a {
					color: pink // c
					;}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a block a mixin call with no semicolon of its own closes, the break in front of the brace parsed into that call`,
			code: `
				a {
					.m()
				}
			`,
			fixed: `
				a {
					.m()}
			`,
			line: 2,
			column: 6,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			description: `the same block with an inline comment behind the call, so the brace has nowhere to go`,
			code: `
				a {
					.m()
					// c
				}
			`,
			fixed: `
				a {
					.m()
					// c
				}
			`,
			message: messages.rejectedBeforeMultiLine,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/333
			description: `the same form feed under a syntax that normalises the line endings of a file before parsing it and reads no line in one, so the brace stands in the comment's text and the block is left alone`,
			code: `a { b: 1px // c\f\t2px; }`,
			fixed: `a { b: 1px // c\f\t2px; }`,
			line: 1,
			column: 22,
			message: messages.rejectedBeforeMultiLine,
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a block whose closing brace the comment has already swallowed, which the break this option writes puts right`,
			code: `
				a {
					color: pink // c}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			message: messages.expectedBefore,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-less`,

	reject: [
		{
			description: `a block whose closing brace the comment has already swallowed, which the break this option writes puts right`,
			code: `
				a {
					color: pink // c}
			`,
			fixed: `
				a {
					color: pink // c
				}
			`,
			message: messages.expectedBeforeMultiLine,
		},
	],
})
