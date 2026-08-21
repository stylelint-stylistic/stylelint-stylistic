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
			description: `an empty stylesheet`,
		},
		{
			autoStripIndent: false,
			code: `\n`,
			description: `a stylesheet holding a single newline`,
		},
		{
			code: `a {}`,
			description: `a stylesheet with no newline at all`,
		},
		{
			code: `a::before { content: "  \n\t\n"; }`,
			description: `whitespace at the end of a line inside a string`,
		},
		{
			code: `a,\nb {}`,
			description: `a comma between two selectors, with no space behind it`,
		},
		{
			code: `a\n{}`,
			description: `a line break in front of the opening brace`,
		},
		{
			code: `a {\n  color: pink; }`,
			description: `indentation on the line after the opening brace`,
		},
		{
			code: `a { color: pink;\n}`,
			description: `a line break in front of the closing brace`,
		},
		{
			code: `a { color: pink; }\nb { color: orange; }`,
			description: `a line break after the closing brace`,
		},
		{
			code: `a { color: pink; }\n\n\nb { color: orange; }`,
			description: `three line breaks after the closing brace`,
		},
		{
			code: `a { color: pink;\n  top: 0; }`,
			description: `indentation on the line after a declaration`,
		},
		{
			code: `a { color:\n\tpink; }`,
			description: `a tab on the line after the colon`,
		},
		{
			code: `a { background-position: top left,\ntop right; }`,
			description: `a value broken after the comma`,
		},
		{
			code: `@media print,\nscreen {}`,
			description: `a media query list broken after the comma`,
		},
		{
			code: `@media print {\n  a { color: pink; } }`,
			description: `indentation on the line after the opening brace of a media query`,
		},
		{
			code: `a\r{}`,
			description: `a bare carriage return in front of the opening brace`,
		},
		{
			code: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			description: `a rule written over several lines, indented with tabs`,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `two media queries, each written over several lines`,
		},
		{
			code: `/* comment\n*/`,
			description: `a comment closed on the line below`,
		},
		{
			autoStripIndent: false,
			code: `/* comment\r\n*/\r\n`,
			description: `the same comment written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			autoStripIndent: false,
			code: ` \n`,
			fixed: `\n`,
			description: `a space in front of the only newline in the stylesheet`,
			message: messages.rejected,
			line: 1,
			column: 1,
		},
		{
			code: `/* foo  \nbar */ a { color: pink; }`,
			fixed: `/* foo\nbar */ a { color: pink; }`,
			description: `two spaces at the end of the first line of a comment`,
			message: messages.rejected,
			line: 1,
			column: 8,
		},
		{
			code: `/* \nfoo */ a { color: pink; }`,
			fixed: `/*\nfoo */ a { color: pink; }`,
			description: `a space at the end of the line a comment opens`,
			message: messages.rejected,
			line: 1,
			column: 3,
		},
		{
			code: `a, \nb {}`,
			fixed: `a,\nb {}`,
			description: `a space behind the comma between two selectors`,
			message: messages.rejected,
			line: 1,
			column: 3,
		},
		{
			code: `a\t\n{}`,
			fixed: `a\n{}`,
			description: `a tab in front of the line break that precedes the opening brace`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a { \n  color: pink; }`,
			fixed: `a {\n  color: pink; }`,
			description: `a space after the opening brace, in front of the line break`,
			message: messages.rejected,
			line: 1,
			column: 4,
		},
		{
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			description: `a space in front of the line break that precedes the closing brace`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color: pink; }\t\nb { color: orange; }`,
			fixed: `a { color: pink; }\nb { color: orange; }`,
			description: `a tab behind the closing brace`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; } \n\n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			description: `a space behind the closing brace, in front of three line breaks`,
			message: messages.rejected,
			line: 1,
			column: 19,
		},
		{
			code: `a { color: pink; }\n \n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			description: `a space on the first of the blank lines behind a rule`,
			message: messages.rejected,
			line: 2,
			column: 1,
		},
		{
			code: `a { color: pink; }\n\n \nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			description: `a space on the second of the blank lines behind a rule`,
			message: messages.rejected,
			line: 3,
			column: 1,
		},
		{
			code: `a { color: pink; \n  top: 0; }`,
			fixed: `a { color: pink;\n  top: 0; }`,
			description: `a space behind a declaration, in front of the line break`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			code: `a { color:\t\n\tpink; }`,
			fixed: `a { color:\n\tpink; }`,
			description: `a tab behind the colon, in front of the line break`,
			message: messages.rejected,
			line: 1,
			column: 11,
		},
		{
			code: `a { background-position: top left, \ntop right; }`,
			fixed: `a { background-position: top left,\ntop right; }`,
			description: `a space behind the comma of a value broken over two lines`,
			message: messages.rejected,
			line: 1,
			column: 35,
		},
		{
			code: `@media print, \nscreen {}`,
			fixed: `@media print,\nscreen {}`,
			description: `a space behind the comma of a media query list broken over two lines`,
			message: messages.rejected,
			line: 1,
			column: 14,
		},
		{
			code: `@media print { \n  a { color: pink; } }`,
			fixed: `@media print {\n  a { color: pink; } }`,
			description: `a space after the opening brace of a media query`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `a\t\r{}`,
			fixed: `a\r{}`,
			description: `a tab in front of the bare carriage return that precedes the opening brace`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a \n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			description: `a space behind the selector`,
			message: messages.rejected,
			line: 1,
			column: 2,
		},
		{
			code: `a\n{\t\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			description: `a tab after the opening brace`,
			message: messages.rejected,
			line: 2,
			column: 2,
		},
		{
			code: `a\n{\n\tcolor: pink; \n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			description: `a space behind the first declaration`,
			message: messages.rejected,
			line: 3,
			column: 14,
		},
		{
			code: `a\n{\n\tcolor: pink;\n\ttop: 0;  \n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			description: `two spaces behind the last declaration`,
			message: messages.rejected,
			line: 4,
			column: 10,
		},
		{
			code: `@media print { \n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space after the opening brace of the outer media query`,
			message: messages.rejected,
			line: 1,
			column: 15,
		},
		{
			code: `@media print {\n  a { \n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space after the opening brace of the nested rule`,
			message: messages.rejected,
			line: 2,
			column: 6,
		},
		{
			code: `@media print {\n  a {\n  color: pink; \n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space behind the declaration of the nested rule`,
			message: messages.rejected,
			line: 3,
			column: 15,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  } \n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space behind the closing brace of the nested rule`,
			message: messages.rejected,
			line: 4,
			column: 4,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n} \n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space behind the closing brace of the media query`,
			message: messages.rejected,
			line: 5,
			column: 2,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n \n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space on the blank line between the two media queries`,
			message: messages.rejected,
			line: 6,
			column: 1,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen { \n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space after the opening brace of the second media query`,
			message: messages.rejected,
			line: 7,
			column: 16,
		},
		{
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; } \n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			description: `a space behind the declaration of the second media query`,
			message: messages.rejected,
			line: 8,
			column: 23,
		},
		{
			code: `a { color \n: \npink; }`,
			fixed: `a { color\n:\npink; }`,
			description: `spaces around a colon broken over three lines`,
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
			description: `a space behind each part of a value broken over five lines`,
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
			description: `spaces on both lines of a comment standing inside a value`,
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
			description: `a space inside a comment standing in the selector, and another behind it`,
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
			description: `a space behind the name of an at-rule broken over two lines`,
			message: messages.rejected,
			line: 1,
			column: 7,
		},
		{
			code: `@media/* \n*/ print {}`,
			fixed: `@media/*\n*/ print {}`,
			description: `a space inside a comment standing behind the name of an at-rule`,
			message: messages.rejected,
			line: 1,
			column: 9,
		},
		{
			code: `@media print,/* \n*/screen {}`,
			fixed: `@media print,/*\n*/screen {}`,
			description: `a space inside a comment standing inside a media query list`,
			message: messages.rejected,
			line: 1,
			column: 16,
		},
		{
			autoStripIndent: false,
			code: `/* comment      \n*/   \n`,
			fixed: `/* comment\n*/\n`,
			description: `spaces at the end of both lines of a comment, and behind it`,
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
			description: `the same stylesheet without a newline at its end`,
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
			autoStripIndent: false,
			code: `/* comment      \r\n*/   \r\n`,
			fixed: `/* comment\r\n*/\r\n`,
			description: `the same written with carriage-return line breaks`,
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
			description: `the same written with carriage-return line breaks and no newline at the end`,
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
			description: `a space behind a declaration, and two closing a stylesheet that ends in no newline`,
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
			autoStripIndent: false,
			code: `// comment 1\n`,
			description: `an end-of-line comment closed by a newline`,
		},
		{
			code: `//\n//comment\n  a\n{ color: red\n}`,
			description: `two end-of-line comments standing in front of a rule`,
		},
	],

	reject: [
		{
			code: `// comment 2  `,
			fixed: `// comment 2`,
			description: `two spaces at the end of an end-of-line comment`,
			warnings: [
				{
					message: messages.rejected,
					line: 1,
					column: 14,
				},
			],
		},
		{
			autoStripIndent: false,
			code: `// comment 3  \r\n`,
			fixed: `// comment 3\r\n`,
			description: `the same spaces in front of a carriage-return line break`,
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
			description: `the same in front of a bare carriage return, with a rule behind it`,
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
			autoStripIndent: false,
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
			description: `trailing whitespace standing in the document rather than in the stylesheet it holds`,
		},
	],

	reject: [
		{
			code: `<style>\na {\n  color: red; \n}\n</style>`,
			fixed: `<style>\na {\n  color: red;\n}\n</style>`,
			description: `a space behind a declaration in an embedded stylesheet`,
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
			description: `spaces alone on an empty line, which the option lets stand`,
		},
		{
			code: `a {}\r\n\t\r\nb {}`,
			description: `a tab alone on an empty line`,
		},
		{
			code: `a {}\n  \t\nb {}`,
			description: `spaces and a tab alone on an empty line`,
		},
		{
			autoStripIndent: false,
			code: ` \n`,
			description: `a space in front of the only newline in the stylesheet`,
		},
	],

	reject: [
		{
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			description: `a space behind a declaration, which the option does not cover`,
			message: messages.rejected,
			line: 1,
			column: 17,
		},
		{
			autoStripIndent: false,
			code: `a { color: pink; }\t\n`,
			fixed: `a { color: pink; }\n`,
			description: `a tab behind the closing brace, which the option does not cover either`,
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
