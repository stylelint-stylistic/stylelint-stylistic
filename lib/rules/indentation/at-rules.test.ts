import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a media query whose rule and declaration each stand a level deeper`,
			code: `
				@media print {
				  a {
				    color: pink;
				  }
				}
			`,
		},
		{
			description: `the same query with its parameters on the line below the name`,
			code: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
		},
		{
			description: `two media queries, each indented throughout`,
			code: `
				@media print {
				  a {
				    color: pink;
				  }
				}

				@media screen {
				  b { color: orange; }
				}
			`,
		},
		{
			description: `the same query written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
		},
		{
			description: `the same parameters on the next line, written with carriage-return line breaks`,
			code: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
		},
		{
			description: `the same two queries written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}\r\n\r\n@media screen {\r\n  b { color: orange; }\r\n}`,
		},
	],

	reject: [
		{
			description: `a media query indented at the root`,
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the rule inside the query left at the root`,
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
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the declaration left level with its rule`,
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
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the closing brace of the rule left at the root`,
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
			line: 4,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing brace of the query indented by a tab`,
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
			line: 5,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same query indented at the root, written with carriage-return line breaks`,
			code: `  @media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same rule left at the root, written with carriage-return line breaks`,
			code: `@media print {\r\na {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same declaration left level with its rule, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n  color: pink;\r\n  }\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`4 spaces`),
		},
		{
			description: `the same closing brace left at the root, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n}\r\n}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 4,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same closing brace indented by a tab, written with carriage-return line breaks`,
			code: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n\t}`,
			fixed: `@media print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 5,
			column: 2,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `parameters on the next line, indented by a single space`,
			code: `@media\n print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media\n  print {\n  a {\n    color: pink;\n  }\n}`,
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media\r\n print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			fixed: `@media\r\n  print {\r\n  a {\r\n    color: pink;\r\n  }\r\n}`,
			line: 2,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375
			description: `a comment standing behind an at-rule with neither a block nor a semicolon, which the parser files into that at-rule's whitespace, both lines written with tabs`,
			code: `a {\n\t@extend .b\n\t/* c */\n}`,
			fixed: `a {\n  @extend .b\n    /* c */\n}`,
			warnings: [
				{ line: 2, column: 2, message: messages.expected(`2 spaces`) },
				{ line: 3, column: 2, message: messages.expected(`4 spaces`) },
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`, { except: [`block`] }],

	accept: [
		{
			description: `a query whose block is spaced out and whose contents stand at the root, as this option asks`,
			code: `
				@media print {

				a {
					color: pink;
				}

				}
			`,
		},
		{
			description: `parameters broken over three lines, each indented one level deeper`,
			code: `
				@media print,
					(-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `the rule inside such a block indented a level too deep`,
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
			line: 3,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the declaration inside such a block left level with its rule`,
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
			line: 4,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `parameters broken over three lines, indented by two spaces where a tab is asked for`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
			fixed: `
				@media print,
					(-webkit-min-device-pixel-ratio: 1.25),
					(min-resolution: 120dpi) {}
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n\t(-webkit-min-device-pixel-ratio: 1.25),\r\n\t(min-resolution: 120dpi) {}`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
	],
})

testRule({
	ruleName,
	config: [4, { except: [`param`] }],

	accept: [
		{
			description: `parameters broken over three lines, none of them indented, as this option asks`,
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `the same parameters indented two spaces`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			fixed: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `@media print,\r\n  (-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,
			fixed: `@media print,\r\n(-webkit-min-device-pixel-ratio: 1.25),\r\n(min-resolution: 120dpi) {}`,
			line: 2,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `a closing parenthesis indented under an option that gives the params no level of their own, which leaves the outermost level at the first column`,
			code: `
				@media (min-width: 100px
				    ) {}
			`,
			fixed: `
				@media (min-width: 100px
				) {}
			`,
			line: 2,
			column: 5,
			message: messages.expected(`0 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the lines inside a parenthesis the params open at the end of a line, which that parenthesis indents whatever the option says about the params themselves`,
			code: `
				@media (
				"a",
				"b"
				) {}
			`,
			fixed: `
				@media (
				    "a",
				    "b"
				) {}
			`,
			warnings: [
				{
					line: 2,
					column: 1,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 3,
					column: 1,
					message: messages.expected(`4 spaces`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: [`param`] }],

	accept: [
		{
			description: `parameters broken over three lines with no indentation, which this option does not measure`,
			code: `
				@media print,
				(-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
		{
			description: `the same parameters indented unevenly, still not measured`,
			code: `
				@media print,
				  (-webkit-min-device-pixel-ratio: 1.25),
				(min-resolution: 120dpi) {}
			`,
		},
	],

	reject: [
		{
			description: `a media query indented at the root, whose parameters the option leaves alone`,
			code: `  @media print {\n  a {\n    color: pink;\n  }\n}`,
			fixed: `@media print {\n  a {\n    color: pink;\n  }\n}`,
			line: 1,
			column: 3,
			message: messages.expected(`0 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [
		2,
		{
			indentClosingBrace: true,
		},
	],

	accept: [
		{
			description: `a query whose closing braces are indented with the blocks they close`,
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				  }
			`,
		},
		{
			description: `two such queries, one behind the other`,
			code: `
				@media print {
				  a {
				    color: pink;
				    }
				  }

				@media screen {
				  b { color: orange; }
				  }
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last at-rule carries neither a block nor a semicolon, indented with the block it closes`,
			code: `
				a {
				  @extend .b
				  }
			`,
		},
	],

	reject: [
		{
			description: `the closing brace of the query indented by a single space`,
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
			line: 5,
			column: 2,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `the closing brace of the rule indented by three spaces`,
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
			line: 4,
			column: 4,
			message: messages.expected(`4 spaces`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last at-rule carries neither a block nor a semicolon, standing at the block's own level where the option asks for one more`,
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
			message: messages.expected(`2 spaces`),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	reject: [
		{
			description: `every mis-indented line of the params, and not only one of them`,
			code: `
				@media (min-width: 1px),
							(max-width: 2px),
							(min-height: 3px) {}
			`,
			fixed: `
				@media (min-width: 1px),
				 (max-width: 2px),
				 (min-height: 3px) {}
			`,
			warnings: [
				{
					line: 2,
					column: 4,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 4,
					message: messages.expected(`1 space`),
				},
			],
		},
		{
			description: `every mis-indented line, whichever side of the params it falls on`,
			code: `
				@media
						print,
						screen {}
			`,
			fixed: `
				@media
				 print,
				 screen {}
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 space`),
				},
			],
		},
		{
			description: `every mis-indented line in front of the params as well`,
			code: `
				@media
						/* a */
						/* b */
						print {}
			`,
			fixed: `
				@media
				 /* a */
				 /* b */
				 print {}
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 3,
					column: 3,
					message: messages.expected(`1 space`),
				},
				{
					line: 4,
					column: 3,
					message: messages.expected(`1 space`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`tab`],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `a closing parenthesis standing alone in the first column, the parenthesis it closes having been opened in the middle of the line above`,
			code: `
				@media (min-width: 100px
				) { a { color: pink; } }
			`,
		},
		{
			description: `two such closing parentheses written one behind the other`,
			code: `
				@media (min-width: calc(
					100px
				)) { a { color: pink; } }
			`,
		},
		{
			description: `two closing parentheses on one line, standing a level out from the lines inside them`,
			code: `
				@media (
					a: (
						b: 1
					)) {}
			`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of a block whose last at-rule carries neither a block nor a semicolon, standing at the level the block does`,
			code: `
				a {
					@extend .b
				}
			`,
		},
		{
			description: `the same block with a comment the at-rule swallowed along with the run in front of the brace`,
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
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `that closing parenthesis indented by a tab, which asks for the outermost level of the params and not for one below it`,
			code: `
				@media (min-width: 100px
					) { a { color: pink; } }
			`,
			fixed: `
				@media (min-width: 100px
				) { a { color: pink; } }
			`,
			line: 2,
			column: 2,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same query nested in a rule, where the outermost level of the params is the level of the at-rule itself`,
			code: `
				a {
					@media (min-width: 100px
						) { color: pink; }
				}
			`,
			fixed: `
				a {
					@media (min-width: 100px
					) { color: pink; }
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `that pair of closing parentheses written in the first column, a level further out than the lines inside them ask for`,
			code: `
				@media (
					a: (
						b: 1
				)) {}
			`,
			fixed: `
				@media (
					a: (
						b: 1
					)) {}
			`,
			line: 4,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/237
			description: `the closing parenthesis of a nested at-rule whose params stand at the at-rule's own level rather than one above it`,
			code: `
				a {
					@nest :is(&, .foo
						) { color: pink; }
				}
			`,
			fixed: `
				a {
					@nest :is(&, .foo
					) { color: pink; }
				}
			`,
			line: 3,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a set of params closing on two lines, the inner parenthesis opened at the end of a line and the outer one in the middle of it`,
			code: `
				@media (min-width: calc(
					100px
					)
					) { a { color: pink; } }
			`,
			fixed: `
				@media (min-width: calc(
					100px
				)
				) { a { color: pink; } }
			`,
			warnings: [
				{
					line: 3,
					column: 2,
					message: messages.expected(`0 tabs`),
				},
				{
					line: 4,
					column: 2,
					message: messages.expected(`0 tabs`),
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/375
			description: `a comment standing behind an at-rule with neither a block nor a semicolon, which the parser files into that at-rule's whitespace rather than into a node of its own`,
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
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `two such comments, each of them a line the at-rule swallowed`,
			code: `
				a {
					@extend .b
					/* c */
					/* d */
				}
			`,
			fixed: `
				a {
					@extend .b
						/* c */
						/* d */
				}
			`,
			warnings: [
				{ line: 3, column: 2, message: messages.expected(`2 tabs`) },
				{ line: 4, column: 2, message: messages.expected(`2 tabs`) },
			],
		},
		{
			description: `the same block written with carriage-return line breaks`,
			code: `a {\r\n\t@extend .b\r\n\t/* c */\r\n}`,
			fixed: `a {\r\n\t@extend .b\r\n\t\t/* c */\r\n}`,
			line: 3,
			column: 2,
			message: messages.expected(`2 tabs`),
		},
		{
			description: `a swallowed comment behind params spanning two lines, so that one fix lands in the params and the other in the whitespace behind them`,
			code: `
				a {
					@include m(
					1px)
					/* c */
				}
			`,
			fixed: `
				a {
					@include m(
						1px)
						/* c */
				}
			`,
			warnings: [
				{ line: 3, column: 2, message: messages.expected(`2 tabs`) },
				{ line: 4, column: 2, message: messages.expected(`2 tabs`) },
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/509
			description: `the closing brace of such a block indented a level in, the run in front of it standing in the at-rule's whitespace rather than in the block's own`,
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
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same block with an empty line in front of the brace, which the fix leaves standing`,
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
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same block written with carriage-return line breaks`,
			code: `a {\r\n\t@extend .b\r\n\t\t}`,
			fixed: `a {\r\n\t@extend .b\r\n}`,
			line: 3,
			column: 3,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `such a block nested in a query, where the brace is asked for the level of the block it closes rather than for none`,
			code: `
				@media x {
					a {
						@extend .b
							}
				}
			`,
			fixed: `
				@media x {
					a {
						@extend .b
					}
				}
			`,
			line: 4,
			column: 4,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a comment the at-rule swallowed and the brace behind it, each measured in the half of the raw that holds it`,
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
			warnings: [
				{ line: 4, column: 3, message: messages.expected(`0 tabs`) },
				{ line: 3, column: 2, message: messages.expected(`2 tabs`) },
			],
		},
	],
})
