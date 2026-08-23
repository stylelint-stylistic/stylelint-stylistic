import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always-multi-line`],

	accept: [
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `an empty line in front of the closing brace`,
			code: `
				a { color: pink;

				}
			`,
		},
		{
			description: `stray semicolons in front of the empty line`,
			code: `
				a { color: pink;; ;

				}
			`,
		},
		{
			description: `a stray semicolon behind the empty line, standing against the brace`,
			code: `
				a { color: pink;;

				;}
			`,
		},
		{
			description: `the empty line spelled with carriage returns`,
			code: `a {color: pink;\r\n\r\n}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `the same empty line made by two bare carriage returns`,
			code: `a {color: pink;\r\r}`,
		},
		{
			description: `the same empty line made by two form feeds`,
			code: `a {color: pink;\f\f}`,
		},
		{
			description: `a block broken open as well as closed`,
			code: `
				a {
				color: pink;

				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\n\r\n}`,
		},
		{
			description: `two blocks on one line, each with its own empty line`,
			code: `
				a { color: pink;

				}b { color: red;

				}
			`,
		},
		{
			description: `more than one empty line, which the option allows as readily as one`,
			code: `
				a {
				color: pink;



				}
			`,
		},
		{
			description: `indentation standing between the empty line and the brace`,
			code: `
				@media print {
				  a {
				     color: pink;

				  }

				}
			`,
		},
		{
			description: `three blocks nested, each closing behind an empty line of its own`,
			code: `
				@media print {
					a {
						color: pink;
						&:hover{
							color: red;

							}

						}

				}
			`,
		},
	],

	reject: [
		{
			description: `a break in front of the brace where an empty line belongs`,
			code: `a { color: pink;\n}`,
			fixed: `a { color: pink;\n\n}`,
			line: 2,
			column: 1,
			message: messages.expected,
		},
		{
			description: `the same break spelled with a carriage return`,
			code: `a { color: pink;\r\n}`,
			fixed: `a { color: pink;\r\n\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `a block whose only breaks are bare carriage returns, the empty line written in the same spelling`,
			code: `a {\rcolor: pink;\r}`,
			fixed: `a {\rcolor: pink;\r\r}`,
			line: 1,
			column: 17,
			message: messages.expected,
		},
		{
			description: `the same block broken with form feeds`,
			code: `a {\fcolor: pink;\f}`,
			fixed: `a {\fcolor: pink;\f\f}`,
			line: 1,
			column: 18,
			message: messages.expected,
		},
		{
			description: `a bare carriage return with two spaces of indentation behind it`,
			code: `a { color: pink;\r  }`,
			fixed: `a { color: pink;\r\r  }`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `an at-rule's block broken with form feeds`,
			code: `@media print {\fcolor: pink;\f}`,
			fixed: `@media print {\fcolor: pink;\f\f}`,
			line: 1,
			column: 29,
			message: messages.expected,
		},
		{
			description: `a stray semicolon behind the break, the empty line belonging behind it rather than in front`,
			code: `a { color: pink;;\n;\n}`,
			fixed: `a { color: pink;;\n;\n\n}`,
			line: 3,
			column: 1,
			message: messages.expected,
		},
		{
			description: `a stray semicolon with nothing behind it, the break of the block written twice in its place`,
			code: `a {\rcolor: pink;\r;}`,
			fixed: `a {\rcolor: pink;\r;\r\r}`,
			line: 1,
			column: 19,
			message: messages.expected,
		},
		{
			description: `a selector broken with a line feed over a block broken with carriage returns, the first break of the file being the one written`,
			code: `a,\nb {\rcolor: pink; }`,
			fixed: `a,\nb {\rcolor: pink; \n\n}`,
			line: 2,
			column: 18,
			message: messages.expected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/267
		{
			description: `a block whose only break stands in a nested selector, which is no whitespace the file keeps between one node and the next`,
			code: `a {b,\rc {color: pink;}}`,
			fixed: `a {b,\rc {color: pink;}\r\r}`,
			line: 1,
			column: 23,
			message: messages.expected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/267
		{
			description: `a block whose only break stands inside an important flag, which is a raw the file keeps whole`,
			code: `a {color: pink !\rimportant;}`,
			fixed: `a {color: pink !\rimportant;\r\r}`,
			line: 1,
			column: 28,
			message: messages.expected,
		},
		{
			description: `a block whose own children open no line, the break standing in the block nested in it being the file's all the same`,
			code: `a {b {\rcolor: pink;\r}}`,
			fixed: `a {b {\rcolor: pink;\r\r}\r\r}`,
			warnings: [
				{
					line: 1,
					column: 22,
					message: messages.expected,
				},
				{
					line: 1,
					column: 20,
					message: messages.expected,
				},
			],
		},
		{
			description: `a block broken only between a declaration's colon and its value`,
			code: `a {color:\rpink;}`,
			fixed: `a {color:\rpink;\r\r}`,
			line: 1,
			column: 16,
			message: messages.expected,
		},
		{
			description: `a block broken only in front of a nested block's opening brace`,
			code: `a {b\r{color: pink;}}`,
			fixed: `a {b\r{color: pink;}\r\r}`,
			line: 1,
			column: 20,
			message: messages.expected,
		},
		{
			description: `a block broken only behind an at-rule's name`,
			code: `a {@media\r(min-width:1px){color: pink;}}`,
			fixed: `a {@media\r(min-width:1px){color: pink;}\r\r}`,
			line: 1,
			column: 40,
			message: messages.expected,
		},
		{
			description: `a comment standing beside the break in the same raw, which is read past rather than out of`,
			code: `a {b/*x*/\r{color: pink;}}`,
			fixed: `a {b/*x*/\r{color: pink;}\r\r}`,
			line: 1,
			column: 25,
			message: messages.expected,
		},
		{
			description: `a space of indentation behind the break`,
			code: `a { color: pink;\n }`,
			fixed: `a { color: pink;\n\n }`,
			line: 2,
			column: 2,
			message: messages.expected,
		},
		{
			description: `a tab of indentation behind the break`,
			code: `a { color: pink;\n\t}`,
			fixed: `a { color: pink;\n\n\t}`,
			line: 2,
			column: 2,
			message: messages.expected,
		},
		{
			description: `a carriage return with two spaces of indentation behind it`,
			code: `a { color: pink;\r\n  }`,
			fixed: `a { color: pink;\r\n\r\n  }`,
			line: 2,
			column: 3,
			message: messages.expected,
		},
		{
			description: `a stray semicolon standing where the empty line belongs`,
			code: `a { color: pink;\n;}`,
			fixed: `a { color: pink;\n;\n\n}`,
			line: 2,
			column: 2,
			message: messages.expected,
		},
		{
			description: `a block broken open, with no empty line to close it`,
			code: `
				a {
				color: pink;
				}
			`,
			fixed: `
				a {
				color: pink;

				}
			`,
			line: 3,
			column: 1,
			message: messages.expected,
		},
		{
			description: `an empty line behind the opening brace and none in front of the closing one`,
			code: `
				a {

				color: pink;
				}
			`,
			fixed: `
				a {

				color: pink;

				}
			`,
			line: 4,
			column: 1,
			message: messages.expected,
		},
		{
			description: `a comment in front of the brace, which is what the empty line has to precede`,
			code: `
				a { color: pink;

				/* comment here*/
				}
			`,
			fixed: `
				a { color: pink;

				/* comment here*/

				}
			`,
			line: 4,
			column: 1,
			message: messages.expected,
		},
		{
			description: `the same comment behind a carriage return`,
			code: `a { color: pink;\r\n\r\n/* comment here*/\r\n}`,
			fixed: `a { color: pink;\r\n\r\n/* comment here*/\r\n\r\n}`,
			line: 4,
			column: 1,
			message: messages.expected,
		},
		{
			description: `a comment closing a nested block, whose own brace has no empty line`,
			code: `
				@media print {
				  a {
				     color: pink;
				/* comment here*/
				  }
				}
			`,
			fixed: `
				@media print {
				  a {
				     color: pink;
				/* comment here*/

				  }

				}
			`,
			warnings: [
				{
					line: 5,
					column: 3,
					message: messages.expected,
				},
				{
					line: 6,
					column: 1,
					message: messages.expected,
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
			description: `a single-line block, which this option passes over`,
			code: `a { color: pink; }`,
		},
		{
			description: `a break in front of the brace and no empty line`,
			code: `a { color: pink;\n}`,
		},
		{
			description: `stray semicolons in front of the break`,
			code: `a { color: pink;; ;\n}`,
		},
		{
			description: `a stray semicolon behind the break, standing against the brace`,
			code: `a { color: pink;;\n;}`,
		},
		{
			description: `the break spelled with a carriage return`,
			code: `a {color: pink;\r\n}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `the break spelled with a bare carriage return, which leaves no empty line either`,
			code: `a {color: pink;\r}`,
		},
		{
			description: `the break spelled with a form feed`,
			code: `a {color: pink;\f}`,
		},
		{
			description: `a block broken open as well as closed`,
			code: `
				a {
				color: pink;
				}
			`,
		},
		{
			description: `the same block spelled with carriage returns`,
			code: `a {\r\ncolor: pink;\r\n}`,
		},
		{
			description: `two blocks on one line, neither with an empty line`,
			code: `
				a { color: pink;
				}b { color: red;
				}
			`,
		},
		{
			description: `indentation standing between the break and the brace`,
			code: `
				@media print {
				  a {
				     color: pink;
				  }
				}
			`,
		},
		{
			description: `three blocks nested, none closing behind an empty line`,
			code: `
				@media print {
					a {
						color: pink;
						&:hover{
							color: red;
							}
						}
				}
			`,
		},
	],

	reject: [
		{
			description: `an empty line in front of the brace`,
			code: `
				a { color: pink;

				}
			`,
			fixed: `
				a { color: pink;
				}
			`,
			line: 3,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `the same empty line spelled with carriage returns`,
			code: `a { color: pink;\r\n\r\n}`,
			fixed: `a { color: pink;\r\n}`,
			line: 3,
			column: 1,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `the same empty line made by two bare carriage returns, and one of them left standing`,
			code: `a {\rcolor: pink;\r\r}`,
			fixed: `a {\rcolor: pink;\r}`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `the same empty line made by two form feeds`,
			code: `a {\fcolor: pink;\f\f}`,
			fixed: `a {\fcolor: pink;\f}`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `two bare carriage returns with two spaces of indentation behind them`,
			code: `a { color: pink;\r\r  }`,
			fixed: `a { color: pink;\r  }`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `three bare carriage returns, which leave one break behind them`,
			code: `a {\rcolor: pink;\r\r\r}`,
			fixed: `a {\rcolor: pink;\r}`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `a stray semicolon standing in the empty line, which is kept while the line goes`,
			code: `a {\rcolor: pink;\r;\r}`,
			fixed: `a {\rcolor: pink;\r;}`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `the same with line feeds, which used to draw a warning no run of the fix could clear`,
			code: `a {\ncolor: pink;\n;\n}`,
			fixed: `a {\ncolor: pink;\n;}`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a space of indentation behind the empty line`,
			code: `
				a { color: pink;

				 }
			`,
			fixed: `
				a { color: pink;
				 }
			`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a tab of indentation behind the empty line`,
			code: `
				a { color: pink;

					}
			`,
			fixed: `
				a { color: pink;
					}
			`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a carriage return with two spaces of indentation behind it`,
			code: `a { color: pink;\r\n\r\n  }`,
			fixed: `a { color: pink;\r\n  }`,
			line: 3,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `a stray semicolon behind the empty line`,
			code: `
				a { color: pink;

				;}
			`,
			fixed: `
				a { color: pink;
				;}
			`,
			line: 3,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a block broken open, closing behind an empty line`,
			code: `
				a {
				color: pink;

				}
			`,
			fixed: `
				a {
				color: pink;
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `empty lines behind the opening brace and in front of the closing one`,
			code: `
				a {

				color: pink;

				}
			`,
			fixed: `
				a {

				color: pink;
				}
			`,
			line: 5,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `nested blocks, each closing behind an empty line`,
			code: `
				@media print {
				  a {
				     color: pink;

				  }

				}
			`,
			fixed: `
				@media print {
				  a {
				     color: pink;
				  }
				}
			`,
			warnings: [
				{
					line: 5,
					column: 3,
					message: messages.rejected,
				},
				{
					line: 7,
					column: 1,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a comment behind the empty line, with the brace behind the comment`,
			code: `
				a {

				color: pink;

				/* comment here */

				}
			`,
			fixed: `
				a {

				color: pink;

				/* comment here */
				}
			`,
			line: 7,
			column: 1,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`never`, { except: [`after-closing-brace`] }],

	accept: [
		{
			description: `a rule at the top level, whose brace follows a declaration rather than a brace`,
			code: `
				a {
					color: aquamarine;
				}
			`,
		},
		{
			description: `a nested rule, whose closing brace follows one and so takes the empty line`,
			code: `
				@media print {

					a {
						color: aquamarine;
					}

				}
			`,
		},
		{
			description: `a rule nested in a rule, the outer brace following the inner one`,
			code: `
				a {

					b {
						color: aquamarine;
					}

				}
			`,
		},
		{
			description: `an at-rule nested in a rule, the outer brace following the at-rule's`,
			code: `
				a {

					@media print {
						color: aquamarine;
					}

				}
			`,
		},
		{
			description: `an at-rule holding declarations alone, whose brace follows no brace`,
			code: `
				@font-face {
					font-family: "MyFont";
					src: url("myfont.woff2") format("woff2");
				}
			`,
		},
		{
			description: `a rule nested in a supports condition`,
			code: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;
					}

				}
			`,
		},
		{
			description: `a keyframe nested in a keyframes block`,
			code: `
				@keyframes test {

					100% {
						color: aquamarine;
					}

				}
			`,
		},
	],

	reject: [
		{
			description: `an empty line in front of a brace that follows a declaration`,
			code: `
				a {
					color: aquamarine;

				}
			`,
			fixed: `
				a {
					color: aquamarine;
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a brace following a closing brace with no empty line in front of it`,
			code: `
				@media print {

					a {
						color: aquamarine;
					}
				}
			`,
			fixed: `
				@media print {

					a {
						color: aquamarine;
					}

				}
			`,
			line: 6,
			column: 1,
			message: messages.expected,
		},
		{
			description: `the last of two nested rules closing with no empty line in front of the outer brace`,
			code: `
				@media print {

					a {
						color: aquamarine;
					}

					b {
						color: hotpink;
					}
				}
			`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\t}\n\n}`,
			warnings: [
				{
					line: 10,
					column: 1,
					message: messages.expected,
				},
			],
		},
		{
			description: `an empty line in front of the inner brace, and none in front of the outer one`,
			code: `
				@media print {

					a {
						color: aquamarine;
					}

					b {
						color: hotpink;

					}
				}
			`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\t}\n\n}`,
			warnings: [
				{
					line: 10,
					column: 2,
					message: messages.rejected,
				},
				{
					line: 11,
					column: 1,
					message: messages.expected,
				},
			],
		},
		{
			description: `a supports condition whose brace follows a closing brace without an empty line`,
			code: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;
					}
				}
			`,
			fixed: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;
					}

				}
			`,
			line: 6,
			column: 1,
			message: messages.expected,
		},
		{
			description: `a keyframes block whose brace follows a closing brace without an empty line`,
			code: `
				@keyframes test {

					100% {
						color: aquamarine;
					}
				}
			`,
			fixed: `
				@keyframes test {

					100% {
						color: aquamarine;
					}

				}
			`,
			line: 6,
			column: 1,
			message: messages.expected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `the same nesting broken with form feeds, the outer brace taking the empty line`,
			code: `@media print {\fa {\fcolor: pink;\f}\f}`,
			fixed: `@media print {\fa {\fcolor: pink;\f}\f\f}`,
			line: 1,
			column: 35,
			message: messages.expected,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`, { except: [`after-closing-brace`] }],

	accept: [
		{
			description: `a rule at the top level, closing behind an empty line`,
			code: `
				a {
					color: aquamarine;

				}
			`,
		},
		{
			description: `a single-line block, which this option passes over`,
			code: `a { color: aquamarine; }`,
		},
		{
			description: `a nested rule, whose outer brace follows a closing brace and so takes no empty line`,
			code: `
				@media print {

					a {
						color: aquamarine;

					}
				}
			`,
		},
		{
			description: `an at-rule holding declarations alone, closing behind an empty line`,
			code: `
				@font-face {
					font-family: "MyFont";
					src: url("myfont.woff2") format("woff2");

				}
			`,
		},
		{
			description: `a rule nested in a supports condition`,
			code: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;

					}
				}
			`,
		},
		{
			description: `a keyframe nested in a keyframes block`,
			code: `
				@keyframes test {

					100% {
						color: aquamarine;

					}
				}
			`,
		},
	],

	reject: [
		{
			description: `a rule at the top level closing with no empty line in front of its brace`,
			code: `
				a {
					color: aquamarine;
				}
			`,
			fixed: `
				a {
					color: aquamarine;

				}
			`,
			line: 3,
			column: 1,
			message: messages.expected,
		},
		{
			description: `an empty line in front of a brace that follows a closing brace`,
			code: `
				@media print {

					a {
						color: aquamarine;

					}

				}
			`,
			fixed: `
				@media print {

					a {
						color: aquamarine;

					}
				}
			`,
			line: 8,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `empty lines in front of both braces, the outer one following the inner`,
			code: `
				@media print {

					a {
						color: aquamarine;

					}

					b {
						color: hotpink;

					}

				}
			`,
			fixed:
				`@media print {\n\n\ta {\n\t\tcolor: aquamarine;\n\n\t}\n\n\tb {\n\t\tcolor: hotpink;\n\n\t}\n}`,
			line: 13,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a supports condition whose brace follows a closing brace behind an empty line`,
			code: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;

					}

				}
			`,
			fixed: `
				@supports (animation-name: test) {

					a {
						color: aquamarine;

					}
				}
			`,
			line: 8,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a keyframes block whose brace follows a closing brace behind an empty line`,
			code: `
				@keyframes test {

					100% {
						color: aquamarine;

					}

				}
			`,
			fixed: `
				@keyframes test {

					100% {
						color: aquamarine;

					}
				}
			`,
			line: 8,
			column: 1,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/245
			description: `the same nesting broken with form feeds, the two braces asking for opposite things`,
			code: `@media print {\fa {\fcolor: pink;\f}\f\f}`,
			fixed: `@media print {\fa {\fcolor: pink;\f\f}\f}`,
			warnings: [
				{
					line: 1,
					column: 33,
					message: messages.expected,
				},
				{
					line: 1,
					column: 36,
					message: messages.rejected,
				},
			],
		},
	],
})
