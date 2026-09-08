import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			description: `a single-line block holding one declaration`,
			code: `a { color: pink; }`,
		},
		{
			description: `a selector list broken over lines in front of a single-line block holding one declaration`,
			code: `
				a,
				b { color: pink; }
			`,
		},
		{
			autoStripIndent: false,
			description: `a single-line block holding one declaration, with a line break behind the rule`,
			code: `a { color: pink; }\n`,
		},
		{
			description: `a block opened by a line break, whose two declarations share its second line`,
			code: `
				a {
				 color: pink; top: 3px; }
			`,
		},
		{
			description: `a block broken between its two declarations`,
			code: `
				a { color: pink;
				 top: 3px; }
			`,
		},
		{
			description: `a single-line block holding one declaration inside a multi-line at-rule`,
			code: `
				@media screen {
				a { color: pink; }}
			`,
		},
		{
			autoStripIndent: false,
			description: `the same rule closed by a carriage-return line break`,
			code: `a { color: pink; }\r\n`,
		},
		{
			description: `the same block opened by a carriage-return line break`,
			code: `a {\r\n color: pink; top: 3px; }`,
		},
		{
			description: `the same block broken with a carriage-return line break between its declarations`,
			code: `a { color: pink;\r\n top: 3px; }`,
		},
		{
			description: `an empty block`,
			code: `a {}`,
		},
		{
			description: `a comment beside the one declaration, which is no declaration`,
			code: `a { color: pink; /* c */ }`,
		},
		{
			description: `a nested rule beside the one declaration, whose own declaration counts to its own block`,
			code: `a { color: pink; & b { top: 0; } }`,
		},
		{
			description: `a nested at-rule beside the one declaration, which is no declaration and whose own declaration counts to its own block`,
			code: `a { color: pink; @media (x) { top: 0; } }`,
		},
		{
			description: `a single-line block of an at-rule holding one declaration`,
			code: `@font-face { src: y; }`,
		},
		{
			description: `a single-line at-rule holding a rule and no declaration of its own`,
			code: `@media screen { a { color: pink; } }`,
		},
		{
			description: `an at-rule without a block`,
			code: `@import "x";`,
		},
		{
			description: `a block of an at-rule broken between its two declarations`,
			code: `
				@font-face { font-family: x;
				 src: y; }
			`,
		},
	],

	reject: [
		{
			description: `a single-line block holding two declarations`,
			code: `a { color: pink; top: 3px; }`,
			fixed: `
				a {
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(1),
		},
		{
			description: `a selector list broken over lines in front of a single-line block holding two declarations, whose warning stands on the block's line`,
			code: `
				a,
				b
				{ color: pink; top: 3px; }
			`,
			fixed: `
				a,
				b
				{
				color: pink;
				top: 3px;
				}
			`,
			line: 3,
			column: 1,
			endLine: 3,
			endColumn: 27,
			message: messages.expected(1),
		},
		{
			description: `a single-line block holding two declarations inside a multi-line at-rule`,
			code: `
				@media screen {
				a { color: pink; top: 3px; }}
			`,
			fixed: `
				@media screen {
				a {
				color: pink;
				top: 3px;
				}}
			`,
			line: 2,
			column: 3,
			endLine: 2,
			endColumn: 29,
			message: messages.expected(1),
		},
		{
			description: `a comment between the two declarations, which hides neither`,
			code: `a { color: pink; /* c */ top: 3px; }`,
			fixed: `
				a {
				color: pink; /* c */
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `two custom properties, which are declarations`,
			code: `a { --x: 1; --y: 2; }`,
			fixed: `
				a {
				--x: 1;
				--y: 2;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(1),
		},
		{
			description: `two declarations of which one carries a flag`,
			code: `a { color: pink !important; top: 3px; }`,
			fixed: `
				a {
				color: pink !important;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(1),
		},
		{
			description: `two declarations written without a trailing semicolon`,
			code: `a { color: pink; top: 3px }`,
			fixed: `
				a {
				color: pink;
				top: 3px
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(1),
		},
		{
			description: `a comment between the selector and the block, which the warning's column reaches past`,
			code: `a /* c */ { color: pink; top: 3px; }`,
			fixed: `
				a /* c */ {
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `a nested rule holding two declarations on one line inside a block holding one, whose warning stands on the nested block`,
			code: `a { color: pink; & b { top: 0; left: 0; } }`,
			fixed: `
				a { color: pink; & b {
				top: 0;
				left: 0;
				} }
			`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 42,
			message: messages.expected(1),
		},
		// #640
		{
			description: `a single-line block of an at-rule holding two declarations`,
			code: `@font-face { font-family: x; src: y; }`,
			fixed: `
				@font-face {
				font-family: x;
				src: y;
				}
			`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 39,
			message: messages.expected(1),
		},
		{
			description: `a single-line block of a page at-rule holding two declarations`,
			code: `@page { margin: 0; size: A4; }`,
			fixed: `
				@page {
				margin: 0;
				size: A4;
				}
			`,
			line: 1,
			column: 7,
			endLine: 1,
			endColumn: 31,
			message: messages.expected(1),
		},
		{
			description: `a single-line block of an at-rule with parameters holding three declarations`,
			code: `@property --x { syntax: "<length>"; inherits: false; initial-value: 0; }`,
			fixed: `
				@property --x {
				syntax: "<length>";
				inherits: false;
				initial-value: 0;
				}
			`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 73,
			message: messages.expected(1),
		},
		{
			description: `a single-line media at-rule holding two declarations of its own`,
			code: `@media screen { color: pink; top: 0; }`,
			fixed: `
				@media screen {
				color: pink;
				top: 0;
				}
			`,
			line: 1,
			column: 15,
			endLine: 1,
			endColumn: 39,
			message: messages.expected(1),
		},
		{
			description: `a nested at-rule holding two declarations on one line, whose warning stands on the nested block`,
			code: `a { @media (x) { color: pink; top: 0; } }`,
			fixed: `
				a { @media (x) {
				color: pink;
				top: 0;
				} }
			`,
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(1),
		},
		{
			description: `an at-rule nested in a single-line at-rule, whose warning stands on the inner block`,
			code: `@media screen { @font-face { font-family: x; src: y; } }`,
			fixed: `
				@media screen { @font-face {
				font-family: x;
				src: y;
				} }
			`,
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 55,
			message: messages.expected(1),
		},
		{
			description: `a comment between the at-rule's name and its block, which the warning's column reaches past`,
			code: `@font-face /* c */ { font-family: x; src: y; }`,
			fixed: `
				@font-face /* c */ {
				font-family: x;
				src: y;
				}
			`,
			line: 1,
			column: 20,
			endLine: 1,
			endColumn: 47,
			message: messages.expected(1),
		},
		{
			description: `a block of an at-rule written without spaces`,
			code: `@font-face{font-family:x;src:y}`,
			fixed: `
				@font-face{
				font-family:x;
				src:y
				}
			`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 32,
			message: messages.expected(1),
		},
		{
			description: `a semicolon behind the block of an at-rule, which stands outside the span`,
			code: `@font-face { font-family: x; src: y; };`,
			fixed: `
				@font-face {
				font-family: x;
				src: y;
				};
			`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 39,
			message: messages.expected(1),
		},
		{
			description: `a single-line block of an at-rule inside a multi-line at-rule`,
			code: `
				@media screen {
				@font-face { font-family: x; src: y; }}
			`,
			fixed: `
				@media screen {
				@font-face {
				font-family: x;
				src: y;
				}}
			`,
			line: 2,
			column: 12,
			endLine: 2,
			endColumn: 39,
			message: messages.expected(1),
		},
		// #641
		{
			description: `a comment at the head of the block, which stays on the brace's line as every rule about that run allows`,
			code: `a { /* c */ color: pink; top: 3px; }`,
			fixed: `
				a { /* c */
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `a comment at the end of the block, which stays on the last declaration's line`,
			code: `a { color: pink; top: 3px; /* c */ }`,
			fixed: `
				a {
				color: pink;
				top: 3px; /* c */
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `two comments between the declarations, which stay on the first declaration's line`,
			code: `a { color: pink; /* c */ /* d */ top: 3px; }`,
			fixed: `
				a {
				color: pink; /* c */ /* d */
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 45,
			message: messages.expected(1),
		},
		{
			description: `a free semicolon between the declarations, which the parser files in front of the second and the fix keeps behind the break`,
			code: `a { color: pink;; top: 3px; }`,
			fixed: `
				a {
				color: pink;
				; top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(1),
		},
		{
			description: `a free semicolon in front of the closing brace, which the fix keeps in front of the break`,
			code: `a { color: pink; top: 3px;; }`,
			fixed: `
				a {
				color: pink;
				top: 3px;;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 30,
			message: messages.expected(1),
		},
		{
			description: `a block written without spaces, whose runs the fix has nothing to replace in`,
			code: `a{color:pink;top:3px}`,
			fixed: `
				a{
				color:pink;
				top:3px
				}
			`,
			line: 1,
			column: 2,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(1),
		},
		{
			description: `a nested rule in front of the two declarations, which the fix puts on a line of its own too`,
			code: `a { & b { x: 1; } color: pink; top: 3px; }`,
			fixed: `
				a {
				& b { x: 1; }
				color: pink;
				top: 3px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 43,
			message: messages.expected(1),
		},
		{
			description: `a rule nested in an at-rule, both over the maximum, which the fix breaks in one run, the outer block first`,
			code: `@media (x) { color: red; top: 0; a { y: 1; z: 2; } }`,
			fixed: `
				@media (x) {
				color: red;
				top: 0;
				a {
				y: 1;
				z: 2;
				}
				}
			`,
			warnings: [
				{
					line: 1,
					column: 12,
					endLine: 1,
					endColumn: 53,
					message: messages.expected(1),
				},
				{
					line: 1,
					column: 36,
					endLine: 1,
					endColumn: 51,
					message: messages.expected(1),
				},
			],
		},
		{
			autoStripIndent: false,
			description: `a file broken with carriage-return line breaks, whose block the fix breaks the same way`,
			code: `a { color: pink; top: 3px; }\r\nb {}\r\n`,
			fixed: `a {\r\ncolor: pink;\r\ntop: 3px;\r\n}\r\nb {}\r\n`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 29,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `a single-line block holding one declaration`,
			code: `a { color: pink; }`,
		},
		{
			description: `a single-line block holding two declarations`,
			code: `a { color: pink; top: 1px; }`,
		},
	],

	reject: [
		{
			description: `a single-line block holding three declarations`,
			code: `a { color: pink; top: 3px; right: 2px; }`,
			fixed: `
				a {
				color: pink;
				top: 3px;
				right: 2px;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 41,
			message: messages.expected(2),
		},
	],
})

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `an empty block`,
			code: `a {}`,
		},
		{
			description: `an empty block of an at-rule`,
			code: `@font-face {}`,
		},
		{
			description: `a single-line at-rule holding a rule on its own line and no declaration of its own`,
			code: `
				@media screen { a {
				 color: pink; } }
			`,
		},
		{
			description: `a block holding one declaration on a line of its own`,
			code: `
				a {
					color: pink;
				}
			`,
		},
	],

	reject: [
		{
			description: `a single-line block holding one declaration`,
			code: `a { color: pink; }`,
			fixed: `
				a {
				color: pink;
				}
			`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(0),
		},
		{
			description: `a single-line block of an at-rule holding one declaration`,
			code: `@font-face { src: y; }`,
			fixed: `
				@font-face {
				src: y;
				}
			`,
			line: 1,
			column: 12,
			endLine: 1,
			endColumn: 23,
			message: messages.expected(0),
		},
	],
})
