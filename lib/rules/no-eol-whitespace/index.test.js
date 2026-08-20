import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			code: ``,
			description: `empty string`,
		},
		{
			code: `\n`,
			description: `no nodes`,
		},
		{
			code: `a {}`,
			description: `no newline`,
		},
		{
			code: `a::before { content: "  \n\t\n"; }`,
			description: `breaking the rule within a string`,
		},
		{
			code: `a,\nb {}`,
			description: `selector delimiter`,
		},
		{
			code: `a\n{}`,
			description: `before opening brace`,
		},
		{
			code: `a {\n  color: pink; }`,
			description: `after opening brace with space after newline`,
		},
		{
			code: `a { color: pink;\n}`,
			description: `before closing brace`,
		},
		{
			code: `a { color: pink; }\nb { color: orange; }`,
			description: `after closing brace`,
		},
		{
			code: `a { color: pink; }\n\n\nb { color: orange; }`,
			description: `multiple newlines after closing brace`,
		},
		{
			code: `a { color: pink;\n  top: 0; }`,
			description: `between declarations with two spaces after newline`,
		},
		{
			code: `a { color:\n\tpink; }`,
			description: `between properties and values with tab after newline`,
		},
		{
			code: `a { background-position: top left,\ntop right; }`,
			description: `within values`,
		},
		{
			code: `@media print,\nscreen {}`,
			description: `within media query list`,
		},
		{
			code: `@media print {\n  a { color: pink; } }`,
			description: `after opening brace of media query with space after newline`,
		},
		{
			code: `a\r{}`,
			description: `carriage return opening brace`,
		},
		{
			code: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
		},
		{
			code: `/* comment\n*/`,
		},
		{
			code: `/* comment\r\n*/\r\n`,
		},
	],

	reject: [
		{
			code: ` \n`,
			fixed: `\n`,
			description: `no nodes with space before newline`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `/* foo  \nbar */ a { color: pink; }`,
			fixed: `/* foo\nbar */ a { color: pink; }`,
			description: `eol-whitespace within a comment`,
			message: messages.rejected,
			line: 1,
			column: 8,
		},
		{
			code: `/* \nfoo */ a { color: pink; }`,
			fixed: `/*\nfoo */ a { color: pink; }`,
			description: `eol-whitespace within a comment left`,
			message: messages.rejected,
			line: 1,
			column: 3,
		},
		{
			code: `a, \nb {}`,
			fixed: `a,\nb {}`,
			description: `selector delimiter with space before newline`,
			message: messages.rejected,
			line: 1,
			column: 3,
		},
		{
			code: `a\t\n{}`,
			fixed: `a\n{}`,
			description: `before opening brace with tab before newline`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a { \n  color: pink; }`,
			fixed: `a {\n  color: pink; }`,
			description: `after opening brace with space before and after newline`,
			message: messages.rejected,
			line: 1,
			column: 4,
		},
		{
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			description: `before closing brace with space before newline`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; }\t\nb { color: orange; }`,
			fixed: `a { color: pink; }\nb { color: orange; }`,
			description: `after closing brace with tab before newline`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } \n\n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\n \n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			message: messages.rejected,
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink; }\n\n \nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			message: messages.rejected,
			line: 3,
			column: 1,
		},
		{
			code: `a { color: pink; \n  top: 0; }`,
			fixed: `a { color: pink;\n  top: 0; }`,
			description: `between declarations with space before and two after newline`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color:\t\n\tpink; }`,
			fixed: `a { color:\n\tpink; }`,
			description: `between properties and values with tab before and after newline`,
			message: messages.rejected,
			line: 1,
			column: 11,
		},
		{
			code: `a { background-position: top left, \ntop right; }`,
			fixed: `a { background-position: top left,\ntop right; }`,
			description: `within values with space before newline`,
			message: messages.rejected,
			line: 1,
			column: 35,
		},
		{
			code: `@media print, \nscreen {}`,
			fixed: `@media print,\nscreen {}`,
			description: `within media query list with space before newline`,
			message: messages.rejected,
			line: 1,
			column: 14,
		},
		{
			code: `@media print { \n  a { color: pink; } }`,
			fixed: `@media print {\n  a { color: pink; } }`,
			description: `after opening brace of media query with space before and after newline`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `a\t\r{}`,
			fixed: `a\r{}`,
			description: `tab before carriage return before opening brace`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a \n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a\n{\t\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			message: messages.rejected,
			line: 2,
			column: 2,
		},
		{
			code: `a\n{\n\tcolor: pink; \n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			message: messages.rejected,
			line: 3,
			column: 14,
		},
		{
			code: `a\n{\n\tcolor: pink;\n\ttop: 0;  \n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			message: messages.rejected,
			line: 4,
			column: 10,
		},
		{
			code: `@media print { \n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `@media print {\n  a { \n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 2,
			column: 6,
		},
		{
			code: `@media print {\n  a {\n  color: pink; \n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 3,
			column: 15,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  } \n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 4,
			column: 4,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n} \n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 5,
			column: 2,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n \n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 6,
			column: 1,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen { \n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 7,
			column: 16,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; } \n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			message: messages.rejected,
			line: 8,
			column: 23,
		},
		{
			code: `a { color \n: \npink; }`,
			fixed: `a { color\n:\npink; }`,
			description: `between before and after newline`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 10,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 2,
				},
			],
		},
		{
			code: `a { padding: 0 \n0 \n0 \n0 \n; }`,
			fixed: `a { padding: 0\n0\n0\n0\n; }`,
			description: `values newline`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 15,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 2,
				},
				{
					message: messages.rejected,
					line: 3,
					column: 2,
				},
				{
					message: messages.rejected,
					line: 4,
					column: 2,
				},
			],
		},
		{
			code: `a { padding: 0 /* \n \n*/0 0 0; }`,
			fixed: `a { padding: 0 /*\n\n*/0 0 0; }`,
			description: `values comment newline`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 18,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 1,
				},
			],
		},
		{
			code: `a/* \n*/ \n.b { }`,
			fixed: `a/*\n*/\n.b { }`,
			description: `raws selector`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 4,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 3,
				},
			],
		},
		{
			code: `@media \n print {}`,
			fixed: `@media\n print {}`,
			description: `afterName`,
			message: messages.rejected,
			line: 1,
			column: 7,
		},
		{
			code: `@media/* \n*/ print {}`,
			fixed: `@media/*\n*/ print {}`,
			description: `afterName`,
			message: messages.rejected,
			line: 1,
			column: 9,
		},
		{
			code: `@media print,/* \n*/screen {}`,
			fixed: `@media print,/*\n*/screen {}`,
			description: `raws params`,
			message: messages.rejected,
			line: 1,
			column: 16,
		},
		{
			code: `/* comment      \n*/   \n`,
			fixed: `/* comment\n*/\n`,
			description: `comments fix properly (1)`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 16,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 5,
				},
			],
		},
		{
			code: `/* comment      \n*/   `,
			fixed: `/* comment\n*/`,
			description: `comments fix properly (2)`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 16,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 5,
				},
			],
		},
		{
			code: `/* comment      \r\n*/   \r\n`,
			fixed: `/* comment\r\n*/\r\n`,
			description: `comments fix properly (3)`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 16,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 5,
				},
			],
		},
		{
			code: `/* comment      \r\n*/   `,
			fixed: `/* comment\r\n*/`,
			description: `comments fix properly (4)`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 16,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 5,
				},
			],
		},
		{
			code: `a\n{ color: red \n}  `,
			fixed: `a\n{ color: red\n}`,
			description: `fix properly without trailing EOL`,
			warnings: [
				{
					message: messages.rejected,
					line: 2,
					column: 13,
				},
				{
					message: messages.rejected,
					line: 3,
					column: 3,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/67
			code: `/* This \n * fix \n * isn't \n * working. \n */`,
			fixed: `/* This\n * fix\n * isn't\n * working.\n */`,
			description: `every line of a comment containing an apostrophe`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 7,
				},
				{
					message: messages.rejected,
					line: 3,
					column: 9,
				},
				{
					message: messages.rejected,
					line: 4,
					column: 12,
				},
			],
		},
		{
			code: `/* This \r\n * isn't \r\n * ok. \r\n */`,
			fixed: `/* This\r\n * isn't\r\n * ok.\r\n */`,
			description: `every line of a CRLF comment containing an apostrophe`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 9,
				},
				{
					message: messages.rejected,
					line: 3,
					column: 7,
				},
			],
		},
		{
			code: `/* say " \n hi \n */`,
			fixed: `/* say "\n hi\n */`,
			description: `every line of a comment containing an unbalanced double quote`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 9,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 4,
				},
			],
		},
		{
			code: `/* a { color: 'x \n b \n */`,
			fixed: `/* a { color: 'x\n b\n */`,
			description: `every line of a comment containing quoted code`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 17,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 3,
				},
			],
		},
		{
			code: `/* a "b \n c" d \n */`,
			fixed: `/* a "b\n c" d\n */`,
			description: `every line of a comment containing a balanced pair of quotes`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 2,
					column: 6,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `// comment 1\n`,
			description: `scss comment (1)`,
		},
		{
			code: `//\n//comment\n  a\n{ color: red\n}`,
			description: `scss comment (2)`,
		},
	],

	reject: [
		{
			code: `// comment 2  `,
			fixed: `// comment 2`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 14,
				},
			],
		},
		{
			code: `// comment 3  \r\n`,
			fixed: `// comment 3\r\n`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 14,
				},
			],
		},
		{
			code: `// comment 3  \ra {color: red}  `,
			fixed: `// comment 3\ra {color: red}`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 14,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 31,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-less`,

	reject: [
		{
			// Unlike `postcss-scss`, `postcss-less` does not end an inline comment at a carriage return, so the comment holds two lines of its own.
			code: `// it's \r ok \na { color: red }\n`,
			fixed: `// it's\r ok\na { color: red }\n`,
			description: `both lines of an inline comment containing an apostrophe`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 8,
				},
				{
					message: messages.rejected,
					line: 1,
					column: 13,
				},
			],
		},
		{
			autoStripIndent: true,
			code: `
				@foo: (
					a,${S}${S}${S}
					b
				);
			`,
			fixed: `
				@foo: (
					a,
					b
				);
			`,
			description: `a Less at-variable keeps the fix written to its params`,
			message: messages.rejected,
			line: 2,
			column: 6,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-html`,

	accept: [
		{
			code: `<div> /* After this comment we have eol whitespace */
<style>
a {
  color: red;
}
</style>

</div>`,
		},
	],

	reject: [
		{
			code: `<style>\na {\n  color: red; \n}\n</style>`,
			fixed: `<style>\na {\n  color: red;\n}\n</style>`,
			message: messages.rejected,
			line: 3,
			column: 14,
		},
	],
})

testRule({
	ruleName,
	config: [true, { ignore: [`empty-lines`] }],

	accept: [
		{
			code: `a {}\n     \nb {}`,
			description: `empty line with spaces`,
		},
		{
			code: `a {}\r\n\t\r\nb {}`,
			description: `empty line with a tab and CRLF`,
		},
		{
			code: `a {}\n  \t\nb {}`,
			description: `empty line with spaces and a tab`,
		},
		{
			code: ` \n`,
			description: `no nodes with space before newline`,
		},
	],

	reject: [
		{
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			description: `typical rejection #1`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; }\t\n`,
			fixed: `a { color: pink; }\n`,
			description: `typical rejection #2`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-scss`,

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/193
			code: `.a // c \n.b {}`,
			fixed: `.a // c\n.b {}`,
			description: `trailing whitespace in the text of an inline comment, which the fix trims in the copy the file spells`,
			message: messages.rejected,
			line: 1,
			column: 8,
		},
	],
})
