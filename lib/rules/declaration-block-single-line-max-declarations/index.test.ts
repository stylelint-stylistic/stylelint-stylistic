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
			description: `a nested at-rule beside the one declaration, which is no declaration`,
			code: `a { color: pink; @media (x) { top: 0; } }`,
		},
		{
			description: `two declarations in the single-line block of an at-rule, which the rule does not read`,
			code: `@font-face { font-family: x; src: y; }`,
		},
	],

	reject: [
		{
			description: `a single-line block holding two declarations`,
			code: `a { color: pink; top: 3px; }`,
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
			line: 2,
			column: 3,
			endLine: 2,
			endColumn: 29,
			message: messages.expected(1),
		},
		{
			description: `a comment between the two declarations, which hides neither`,
			code: `a { color: pink; /* c */ top: 3px; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `two custom properties, which are declarations`,
			code: `a { --x: 1; --y: 2; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 22,
			message: messages.expected(1),
		},
		{
			description: `two declarations of which one carries a flag`,
			code: `a { color: pink !important; top: 3px; }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 40,
			message: messages.expected(1),
		},
		{
			description: `two declarations written without a trailing semicolon`,
			code: `a { color: pink; top: 3px }`,
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 28,
			message: messages.expected(1),
		},
		{
			description: `a comment between the selector and the block, which the warning's column reaches past`,
			code: `a /* c */ { color: pink; top: 3px; }`,
			line: 1,
			column: 11,
			endLine: 1,
			endColumn: 37,
			message: messages.expected(1),
		},
		{
			description: `a nested rule holding two declarations on one line inside a block holding one, whose warning stands on the nested block`,
			code: `a { color: pink; & b { top: 0; left: 0; } }`,
			line: 1,
			column: 22,
			endLine: 1,
			endColumn: 42,
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
			line: 1,
			column: 3,
			endLine: 1,
			endColumn: 19,
			message: messages.expected(0),
		},
	],
})
