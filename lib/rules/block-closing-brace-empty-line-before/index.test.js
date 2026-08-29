import { messages, ruleName } from "./index.js"

// A space no editor trims from the end of a line.
const S = ` `

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
			description: `two form feeds in front of the brace, which are whitespace and no empty line, so the block stays single-line and is left alone`,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `an empty line in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b

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
			description: `a stray semicolon behind the break, the empty line belonging behind it rather than in front`,
			code: `a { color: pink;;\n;\n}`,
			fixed: `a { color: pink;;\n;\n\n}`,
			line: 3,
			column: 1,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a single break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b

				}
			`,
			line: 3,
			column: 1,
			message: messages.expected,
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
					/* c */

				}
			`,
			line: 4,
			column: 1,
			message: messages.expected,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a single break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the parser files into that at-rule rather than into the block`,
			code: `
				a {
					@extend .b
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `an empty line in front of the brace of a block an at-rule with neither a block nor a semicolon closes`,
			code: `
				a {
					@extend .b

				}
			`,
			fixed: `
				a {
					@extend .b
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejected,
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
					/* c */
				}
			`,
			line: 5,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `an empty line in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the reversed option asks for`,
			code: `
				a {
					@extend .b

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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a single break in front of that brace, where the reversed option asks for an empty line`,
			code: `
				a {
					@extend .b
				}
			`,
			fixed: `
				a {
					@extend .b

				}
			`,
			line: 3,
			column: 1,
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
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `a single break in front of the brace of a block an at-rule with neither a block nor a semicolon closes, which the reversed option asks for`,
			code: `
				a {
					@extend .b
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/292
			description: `an empty line in front of that brace, which the reversed option asks to go`,
			code: `
				a {
					@extend .b

				}
			`,
			fixed: `
				a {
					@extend .b
				}
			`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [`always-multi-line`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `a single-line block behind a media feature holding an inline comment, which the option leaves alone because the block is on one line however wide the comment is printed`,
			code: `
				@media (min-width: 100px // c
					) { a { color: red; } }
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139
			description: `no empty line in front of the closing brace of a block whose value carries on past an inline comment`,
			code: `
				a { b: 1px // c
					2px; }
			`,
			fixed: `
				a { b: 1px // c
					2px;${S}

				}
			`,
			line: 2,
			column: 7,
			message: messages.expected,
		},
	],
})
