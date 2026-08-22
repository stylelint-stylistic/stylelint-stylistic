import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName })

// A space no editor trims from the end of a line.
const S = ` `

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			autoStripIndent: false,
			description: `a stylesheet holding a single newline`,
			code: `\n`,
		},
		{
			description: `a stylesheet with no newline at all`,
			code: `a {}`,
		},
		{
			description: `whitespace at the end of a line inside a string`,
			code: `a::before { content: "  \n\t\n"; }`,
		},
		{
			description: `a comma between two selectors, with no space behind it`,
			code: `a,\nb {}`,
		},
		{
			description: `a line break in front of the opening brace`,
			code: `a\n{}`,
		},
		{
			description: `indentation on the line after the opening brace`,
			code: `a {\n  color: pink; }`,
		},
		{
			description: `a line break in front of the closing brace`,
			code: `a { color: pink;\n}`,
		},
		{
			description: `a line break after the closing brace`,
			code: `a { color: pink; }\nb { color: orange; }`,
		},
		{
			description: `three line breaks after the closing brace`,
			code: `
				a { color: pink; }


				b { color: orange; }
			`,
		},
		{
			description: `indentation on the line after a declaration`,
			code: `a { color: pink;\n  top: 0; }`,
		},
		{
			description: `a tab on the line after the colon`,
			code: `a { color:\n\tpink; }`,
		},
		{
			description: `a value broken after the comma`,
			code: `a { background-position: top left,\ntop right; }`,
		},
		{
			description: `a media query list broken after the comma`,
			code: `@media print,\nscreen {}`,
		},
		{
			description: `indentation on the line after the opening brace of a media query`,
			code: `@media print {\n  a { color: pink; } }`,
		},
		{
			description: `a bare carriage return in front of the opening brace`,
			code: `a\r{}`,
		},
		{
			description: `a rule written over several lines, indented with tabs`,
			code: `
				a
				{
					color: pink;
					top: 0;
				}
			`,
		},
		{
			description: `two media queries, each written over several lines`,
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
			description: `a comment closed on the line below`,
			code: `/* comment\n*/`,
		},
		{
			autoStripIndent: false,
			description: `the same comment written with carriage-return line breaks`,
			code: `/* comment\r\n*/\r\n`,
		},
	],

	reject: [
		{
			autoStripIndent: false,
			description: `a space in front of the only newline in the stylesheet`,
			code: ` \n`,
			fixed: `\n`,
			line: 1,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `two spaces at the end of the first line of a comment`,
			code: `/* foo  \nbar */ a { color: pink; }`,
			fixed: `/* foo\nbar */ a { color: pink; }`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `the same two spaces where a form feed ends the line instead`,
			code: `/* foo  \fbar */ a { color: pink; }`,
			fixed: `/* foo\fbar */ a { color: pink; }`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
		{
			description: `a space at the end of the line a comment opens`,
			code: `/* \nfoo */ a { color: pink; }`,
			fixed: `/*\nfoo */ a { color: pink; }`,
			line: 1,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `a space behind the comma between two selectors`,
			code: `a, \nb {}`,
			fixed: `a,\nb {}`,
			line: 1,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `a tab in front of the line break that precedes the opening brace`,
			code: `a\t\n{}`,
			fixed: `a\n{}`,
			line: 1,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a space after the opening brace, in front of the line break`,
			code: `a { \n  color: pink; }`,
			fixed: `a {\n  color: pink; }`,
			line: 1,
			column: 4,
			message: messages.rejected,
		},
		{
			description: `a space in front of the line break that precedes the closing brace`,
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/247
			description: `the same space where a form feed is the break, which ends a line to every syntax the plugin reads through`,
			code: `a { color: pink; \f}`,
			fixed: `a { color: pink;\f}`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a tab behind the closing brace`,
			code: `a { color: pink; }\t\nb { color: orange; }`,
			fixed: `a { color: pink; }\nb { color: orange; }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `a space behind the closing brace, in front of three line breaks`,
			code: `a { color: pink; } \n\n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			line: 1,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `a space on the first of the blank lines behind a rule`,
			code: `a { color: pink; }\n \n\nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			line: 2,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a space on the second of the blank lines behind a rule`,
			code: `a { color: pink; }\n\n \nb { color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb { color: orange; }`,
			line: 3,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a space behind a declaration, in front of the line break`,
			code: `a { color: pink; \n  top: 0; }`,
			fixed: `a { color: pink;\n  top: 0; }`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a tab behind the colon, in front of the line break`,
			code: `a { color:\t\n\tpink; }`,
			fixed: `a { color:\n\tpink; }`,
			line: 1,
			column: 11,
			message: messages.rejected,
		},
		{
			description: `a space behind the comma of a value broken over two lines`,
			code: `a { background-position: top left, \ntop right; }`,
			fixed: `a { background-position: top left,\ntop right; }`,
			line: 1,
			column: 35,
			message: messages.rejected,
		},
		{
			description: `a space behind the comma of a media query list broken over two lines`,
			code: `@media print, \nscreen {}`,
			fixed: `@media print,\nscreen {}`,
			line: 1,
			column: 14,
			message: messages.rejected,
		},
		{
			description: `a space after the opening brace of a media query`,
			code: `@media print { \n  a { color: pink; } }`,
			fixed: `@media print {\n  a { color: pink; } }`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `a tab in front of the bare carriage return that precedes the opening brace`,
			code: `a\t\r{}`,
			fixed: `a\r{}`,
			line: 1,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a space behind the selector`,
			code: `a \n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			line: 1,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a tab after the opening brace`,
			code: `a\n{\t\n\tcolor: pink;\n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			line: 2,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a space behind the first declaration`,
			code: `a\n{\n\tcolor: pink; \n\ttop: 0;\n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			line: 3,
			column: 14,
			message: messages.rejected,
		},
		{
			description: `two spaces behind the last declaration`,
			code: `a\n{\n\tcolor: pink;\n\ttop: 0;  \n}`,
			fixed: `a\n{\n\tcolor: pink;\n\ttop: 0;\n}`,
			line: 4,
			column: 10,
			message: messages.rejected,
		},
		{
			description: `a space after the opening brace of the outer media query`,
			code: `@media print { \n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 1,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `a space after the opening brace of the nested rule`,
			code: `@media print {\n  a { \n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 2,
			column: 6,
			message: messages.rejected,
		},
		{
			description: `a space behind the declaration of the nested rule`,
			code: `@media print {\n  a {\n  color: pink; \n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 3,
			column: 15,
			message: messages.rejected,
		},
		{
			description: `a space behind the closing brace of the nested rule`,
			code: `@media print {\n  a {\n  color: pink;\n  } \n}\n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 4,
			column: 4,
			message: messages.rejected,
		},
		{
			description: `a space behind the closing brace of the media query`,
			code: `@media print {\n  a {\n  color: pink;\n  }\n} \n\n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 5,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a space on the blank line between the two media queries`,
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n \n@media screen {\n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 6,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `a space after the opening brace of the second media query`,
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen { \n  b { color: orange; }\n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 7,
			column: 16,
			message: messages.rejected,
		},
		{
			description: `a space behind the declaration of the second media query`,
			code: `@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; } \n}`,
			fixed:
				`@media print {\n  a {\n  color: pink;\n  }\n}\n\n@media screen {\n  b { color: orange; }\n}`,
			line: 8,
			column: 23,
			message: messages.rejected,
		},
		{
			description: `spaces around a colon broken over three lines`,
			code: `a { color \n: \npink; }`,
			fixed: `a { color\n:\npink; }`,
			warnings: [
				{
					line: 1,
					column: 10,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 2,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a space behind each part of a value broken over five lines`,
			code: `a { padding: 0 \n0 \n0 \n0 \n; }`,
			fixed: `a { padding: 0\n0\n0\n0\n; }`,
			warnings: [
				{
					line: 1,
					column: 15,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 2,
					message: messages.rejected,
				},
				{
					line: 3,
					column: 2,
					message: messages.rejected,
				},
				{
					line: 4,
					column: 2,
					message: messages.rejected,
				},
			],
		},
		{
			description: `spaces on both lines of a comment standing inside a value`,
			code: `a { padding: 0 /* \n \n*/0 0 0; }`,
			fixed: `a { padding: 0 /*\n\n*/0 0 0; }`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 1,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a space inside a comment standing in the selector, and another behind it`,
			code: `a/* \n*/ \n.b { }`,
			fixed: `a/*\n*/\n.b { }`,
			warnings: [
				{
					line: 1,
					column: 4,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 3,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a space behind the name of an at-rule broken over two lines`,
			code: `@media \n print {}`,
			fixed: `@media\n print {}`,
			line: 1,
			column: 7,
			message: messages.rejected,
		},
		{
			description: `a space inside a comment standing behind the name of an at-rule`,
			code: `@media/* \n*/ print {}`,
			fixed: `@media/*\n*/ print {}`,
			line: 1,
			column: 9,
			message: messages.rejected,
		},
		{
			description: `a space inside a comment standing inside a media query list`,
			code: `@media print,/* \n*/screen {}`,
			fixed: `@media print,/*\n*/screen {}`,
			line: 1,
			column: 16,
			message: messages.rejected,
		},
		{
			autoStripIndent: false,
			description: `spaces at the end of both lines of a comment, and behind it`,
			code: `/* comment      \n*/   \n`,
			fixed: `/* comment\n*/\n`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same stylesheet without a newline at its end`,
			code: `/* comment      \n*/   `,
			fixed: `/* comment\n*/`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			autoStripIndent: false,
			description: `the same written with carriage-return line breaks`,
			code: `/* comment      \r\n*/   \r\n`,
			fixed: `/* comment\r\n*/\r\n`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same written with carriage-return line breaks and no newline at the end`,
			code: `/* comment      \r\n*/   `,
			fixed: `/* comment\r\n*/`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 5,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a space behind a declaration, and two closing a stylesheet that ends in no newline`,
			code: `a\n{ color: red \n}  `,
			fixed: `a\n{ color: red\n}`,
			warnings: [
				{
					line: 2,
					column: 13,
					message: messages.rejected,
				},
				{
					line: 3,
					column: 3,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same stylesheet written with form feeds, which postcss counts as no line at all`,
			code: `a\f{ color: red \f}  `,
			fixed: `a\f{ color: red\f}`,
			warnings: [
				{
					line: 1,
					column: 15,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 19,
					message: messages.rejected,
				},
			],
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/67
			description: `every line of a comment containing an apostrophe`,
			code: `/* This \n * fix \n * isn't \n * working. \n */`,
			fixed: `/* This\n * fix\n * isn't\n * working.\n */`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 7,
					message: messages.rejected,
				},
				{
					line: 3,
					column: 9,
					message: messages.rejected,
				},
				{
					line: 4,
					column: 12,
					message: messages.rejected,
				},
			],
		},
		{
			description: `every line of a CRLF comment containing an apostrophe`,
			code: `/* This \r\n * isn't \r\n * ok. \r\n */`,
			fixed: `/* This\r\n * isn't\r\n * ok.\r\n */`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 9,
					message: messages.rejected,
				},
				{
					line: 3,
					column: 7,
					message: messages.rejected,
				},
			],
		},
		{
			description: `every line of a comment containing an unbalanced double quote`,
			code: `/* say " \n hi \n */`,
			fixed: `/* say "\n hi\n */`,
			warnings: [
				{
					line: 1,
					column: 9,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 4,
					message: messages.rejected,
				},
			],
		},
		{
			description: `every line of a comment containing quoted code`,
			code: `/* a { color: 'x \n b \n */`,
			fixed: `/* a { color: 'x\n b\n */`,
			warnings: [
				{
					line: 1,
					column: 17,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 3,
					message: messages.rejected,
				},
			],
		},
		{
			description: `every line of a comment containing a balanced pair of quotes`,
			code: `/* a "b \n c" d \n */`,
			fixed: `/* a "b\n c" d\n */`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 2,
					column: 6,
					message: messages.rejected,
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
			description: `an end-of-line comment closed by a newline`,
			code: `// comment 1\n`,
		},
		{
			description: `two end-of-line comments standing in front of a rule`,
			code: `//\n//comment\n  a\n{ color: red\n}`,
		},
	],

	reject: [
		{
			description: `two spaces at the end of an end-of-line comment`,
			code: `// comment 2  `,
			fixed: `// comment 2`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
			],
		},
		{
			autoStripIndent: false,
			description: `the same spaces in front of a carriage-return line break`,
			code: `// comment 3  \r\n`,
			fixed: `// comment 3\r\n`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same spaces in front of the form feed that ends the comment, with a rule behind it`,
			code: `// comment 3  \fa { color: red }`,
			fixed: `// comment 3\fa { color: red }`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same in front of a bare carriage return, with a rule behind it`,
			code: `// comment 3  \ra {color: red}  `,
			fixed: `// comment 3\ra {color: red}`,
			warnings: [
				{
					line: 1,
					column: 14,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 31,
					message: messages.rejected,
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
			description: `both lines of an inline comment containing an apostrophe`,
			// Unlike `postcss-scss`, `postcss-less` does not end an inline comment at a carriage return, so the comment holds two lines of its own.
			code: `// it's \r ok \na { color: red }\n`,
			fixed: `// it's\r ok\na { color: red }\n`,
			warnings: [
				{
					line: 1,
					column: 8,
					message: messages.rejected,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejected,
				},
			],
		},
		{
			description: `two spaces in front of the form feed a file ending on an inline comment ends with`,
			// That break is no end of a comment to `postcss-less`, so both it and the whitespace in front of it stand in the raw behind the comment's text.
			code: `// c  \f`,
			fixed: `// c\f`,
			warnings: [
				{
					line: 1,
					column: 6,
					message: messages.rejected,
				},
			],
		},
		{
			description: `the same two spaces in front of a bare carriage return, behind a rule`,
			code: `a { b: 1; } // c  \r`,
			fixed: `a { b: 1; } // c\r`,
			warnings: [
				{
					line: 1,
					column: 18,
					message: messages.rejected,
				},
			],
		},
		{
			description: `a Less at-variable keeps the fix written to its params`,
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
			line: 2,
			column: 6,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [true],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `trailing whitespace standing in the document rather than in the stylesheet it holds`,
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
			description: `a space behind a declaration in an embedded stylesheet`,
			code: `<style>\na {\n  color: red; \n}\n</style>`,
			fixed: `<style>\na {\n  color: red;\n}\n</style>`,
			line: 3,
			column: 14,
			message: messages.rejected,
		},
	],
})

testRule({
	ruleName,
	config: [true, { ignore: [`empty-lines`] }],

	accept: [
		{
			description: `spaces alone on an empty line, which the option lets stand`,
			code: `a {}\n     \nb {}`,
		},
		{
			description: `a tab alone on an empty line`,
			code: `a {}\r\n\t\r\nb {}`,
		},
		{
			description: `spaces alone on the line two form feeds make`,
			code: `a {}\f  \fb {}`,
		},
		{
			description: `the same spaces on the line two bare carriage returns make`,
			code: `a {}\r  \rb {}`,
		},
		{
			description: `spaces and a tab alone on an empty line`,
			code: `a {}\n  \t\nb {}`,
		},
		{
			autoStripIndent: false,
			description: `a space in front of the only newline in the stylesheet`,
			code: ` \n`,
		},
	],

	reject: [
		{
			description: `a space behind a declaration, which the option does not cover`,
			code: `a { color: pink; \n}`,
			fixed: `a { color: pink;\n}`,
			line: 1,
			column: 17,
			message: messages.rejected,
		},
		{
			description: `a space behind a rule on a line two form feeds make, which holds more than whitespace`,
			code: `a {}\fb {} \fc {}`,
			fixed: `a {}\fb {}\fc {}`,
			line: 1,
			column: 10,
			message: messages.rejected,
		},
		{
			autoStripIndent: false,
			description: `a tab behind the closing brace, which the option does not cover either`,
			code: `a { color: pink; }\t\n`,
			fixed: `a { color: pink; }\n`,
			line: 1,
			column: 19,
			message: messages.rejected,
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
			description: `trailing whitespace in the text of an inline comment, which the fix trims in the copy the file spells`,
			code: `.a // c \n.b {}`,
			fixed: `.a // c\n.b {}`,
			line: 1,
			column: 8,
			message: messages.rejected,
		},
	],
})
