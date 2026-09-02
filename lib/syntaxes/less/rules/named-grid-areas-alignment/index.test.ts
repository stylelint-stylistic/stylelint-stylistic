import { createRule } from "../../../../rules/named-grid-areas-alignment/index.ts"
import { less } from "../../index.ts"

let { ruleName, messages } = createRule(less)

let testRule = createTestRule({ ruleName })

/** A double slash opens a comment, and the parser walking the value has no node of that kind */
testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	accept: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a row standing in the text of an end-of-line comment that opens the value, where the rows behind it are aligned`,
			code: `
				a {
					grid-template-areas: // "a  a"
						"b b"
						"c c";
				}
			`,
		},
		{
			description: `rows aligned to each other rather than to the row standing in a comment between them`,
			code: `
				a {
					grid-template-areas: "a a"
						// "bbb bbb"
						"c c";
				}
			`,
		},
		{
			description: `a row standing behind a form feed inside an end-of-line comment, which is whitespace and closes no comment, so the row is the comment's text`,
			code: `a { grid-template-areas: "a a" // x\f"b   b"\n"c c"; }`,
		},
		{
			description: `rows aligned to a cell holding a double slash, which opens no comment inside quotes`,
			code: `
				a {
					grid-template-areas: "a//a a"
						"b    b";
				}
			`,
		},
	],

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/504
		{
			description: `an apostrophe written in one end-of-line comment and another in the next, whose quotation marks the value parser pairs into a string of neither, so that the row standing between the two comments is that string's text to the parser`,
			code: `
				a {
					grid-template-areas: // it's here
						'a  a'
						// don't
						'b b';
				}
			`,
			fixed: `
				a {
					grid-template-areas: // it's here
						'a a'
						// don't
						'b b';
				}
			`,
			line: 2,
			column: 23,
			endLine: 5,
			endColumn: 8,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a row standing in the text of an end-of-line comment that opens the value, where the rows behind it are not aligned`,
			code: `
				a {
					grid-template-areas: // "a  a"
						"b b"
						"c   c";
				}
			`,
			fixed: `
				a {
					grid-template-areas: // "a  a"
						"b b"
						"c c";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 10,
			message: messages.expected(),
		},
		{
			description: `rows aligned to the width of a row standing in a comment between them, which is no row of the grid`,
			code: `
				a {
					grid-template-areas: "a   a"
						// "bbb bbb"
						"c   c";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a"
						// "bbb bbb"
						"c c";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 10,
			message: messages.expected(),
		},
		{
			description: `a call standing in the text of such a comment, beside a row of the grid that is not aligned`,
			code: `
				a {
					grid-template-areas: "a  a"
						// f(1)
						"b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a"
						// f(1)
						"b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 8,
			message: messages.expected(),
		},
		{
			description: `a call the parser opened outside such a comment and closed on the line below it, carrying the whole comment inside itself`,
			code: `
				a {
					grid-template-areas: "a  a" f(1 // z
						) "b b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a a" f(1 // z
						) "b b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 10,
			message: messages.expected(),
		},
		{
			description: `a row the parser filed inside such a call, which is a row of no grid and a row the next run would move again, in a value neither compiler reads`,
			code: `a { grid-template-areas: "a  a" f( // z ) "b   b"; }`,
			fixed: `a { grid-template-areas: "a a" f( // z ) "b   b"; }`,
			line: 1,
			column: 26,
			endLine: 1,
			endColumn: 50,
			message: messages.expected(),
		},
		{
			description: `a block comment opened as a slash, a star and a slash standing between the rows, which the value parser closes on that third character`,
			code: `
				a {
					grid-template-areas: "a  a"
						/*///*/"bbb bbb";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a   a"
						/*///*/"bbb bbb";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 19,
			message: messages.expected(),
		},
		{
			description: `a cell holding a double slash, which opens no comment inside quotes`,
			code: `
				a {
					grid-template-areas: "a//a a"
						"b   b";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a//a a"
						"b    b";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 10,
			message: messages.expected(),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/368
		{
			description: `a row holding no cell in front of a row standing in the text of an end-of-line comment, which is a row of no grid and takes no place among them`,
			code: `
				a {
					grid-template-areas: ""
						// "b   b"
						"c  c";
				}
			`,
			fixed: `
				a {
					grid-template-areas: ""
						// "b   b"
						"c c";
				}
			`,
			line: 2,
			column: 23,
			endLine: 4,
			endColumn: 9,
			message: messages.expected(),
		},
	],
})

/** The width of the longest row, measured without the row standing in a comment */
testRule({
	ruleName,
	config: [true, { alignQuotes: true }],
	customSyntax: `postcss-less`,

	reject: [
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/322
		{
			description: `a row shorter than the longest of the rows, measured without the row standing in a comment`,
			code: `
				a {
					grid-template-areas: "a  a" // "x   x"
						"bb bb";
				}
			`,
			fixed: `
				a {
					grid-template-areas: "a  a " // "x   x"
						"bb bb";
				}
			`,
			line: 2,
			column: 23,
			endLine: 3,
			endColumn: 10,
			message: messages.expected(),
		},
	],
})
