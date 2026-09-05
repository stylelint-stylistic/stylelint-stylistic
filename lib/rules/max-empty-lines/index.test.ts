import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `a rule closed by a newline, with no blank line anywhere`,
			code: `a {}\n`,
		},
		{
			description: `a rule closed by a newline with spaces behind it, which this option counts no line for either`,
			code: `a {}\n   `,
		},
	],
	reject: [
		{
			description: `a blank line opening the stylesheet`,
			code: `\na {}`,
			fixed: `a {}`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a blank line closing the stylesheet with a run of spaces behind it, which this option reported without counting the end of the file at all`,
			code: `a {}\n\n   `,
			fixed: `a {}\n   `,
			line: 2,
			column: 1,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481
		{
			description: `a blank line in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n}\n`,
			fixed: `a {\n\tb: c;\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(0),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404
		{
			description: `a stylesheet holding a line break and a run of spaces, whose one empty line is the line it opens on and whose run ends a line of its own and is left where it stood`,
			code: `\n   `,
			fixed: `   `,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `the same stylesheet written with a carriage-return line break`,
			code: `\r\n   `,
			fixed: `   `,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a stylesheet holding two line breaks and a run of spaces, which are two empty lines and are both taken away`,
			code: `\n\n   `,
			fixed: `   `,
			warnings: [
				{
					line: 1,
					column: 1,
					message: messages.expected(0),
				},
				{
					line: 2,
					column: 1,
					message: messages.expected(0),
				},
			],
		},
		{
			description: `a stylesheet holding a line break, a run of spaces and a line break, whose last break closes a line of its own and is let stand as the end of any file is`,
			code: `\n   \n`,
			fixed: `   \n`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
		{
			description: `a stylesheet holding a line break and a free semicolon, which is no node of the stylesheet and is left where it stood`,
			code: `\n;`,
			fixed: `;`,
			line: 1,
			column: 1,
			message: messages.expected(0),
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			description: `a blank line opening the stylesheet`,
			code: `\na {}`,
		},
		{
			description: `the same blank line written with a carriage-return line break`,
			code: `\r\na {}`,
		},
		{
			description: `a rule closed by a newline`,
			code: `a {}\n`,
		},
		{
			description: `the same rule closed by a carriage-return line break`,
			code: `a {}\r\n`,
		},
		{
			description: `a rule closed by a newline with spaces behind it, which end a line of their own and no empty one`,
			code: `a {}\n   `,
		},
		{
			description: `two rules with a single line break between them`,
			code: `a {}\nb {}`,
		},
		{
			description: `the same written with a carriage-return line break`,
			code: `a {}\r\nb {}`,
		},
		{
			description: `a blank line between two rules`,
			code: `a {}\n\nb {}`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `a {}\r\n\r\nb {}`,
		},
		{
			description: `a blank line between a comment and a rule`,
			code: `/** horse */\n\nb {}`,
		},
		{
			description: `the same blank line written with carriage-return line breaks`,
			code: `/** horse */\r\n\r\nb {}`,
		},
		{
			description: `blank lines on either side of a comment standing between two rules`,
			code: `a {}\n\n/** horse */\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404
		{
			description: `a stylesheet holding nothing but a line break, which is one empty line and not one for its beginning and one for its end`,
			code: `\n`,
		},
		{
			description: `the same stylesheet written with a carriage-return line break`,
			code: `\r\n`,
		},
		{
			description: `the same stylesheet with a run of spaces written behind the break, which ends a line of its own and hides nothing`,
			code: `\n   `,
		},
	],

	reject: [
		{
			description: `two blank lines opening the stylesheet`,
			code: `\n\na {}`,
			fixed: `\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `\r\n\r\na {}`,
			fixed: `\r\na {}`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines closing the stylesheet`,
			code: `a {}\n\n`,
			fixed: `a {}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n`,
			fixed: `a {}\r\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same two blank lines with a run of spaces written behind them, which ends a line of its own and hides neither of the two`,
			code: `a {}\n\n   `,
			fixed: `a {}\n   `,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same run of spaces behind carriage-return line breaks`,
			code: `a {}\r\n\r\n   `,
			fixed: `a {}\r\n   `,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same run written as a single tab`,
			code: `a {}\n\n\t`,
			fixed: `a {}\n\t`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines between two rules`,
			code: `a {}\n\n\nb {}`,
			fixed: `a {}\n\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines behind a comment`,
			code: `a {}\n\n/** horse */\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a comment`,
			code: `a {}\n\n\n/** horse */\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside a comment`,
			code: `/* horse\n\n\n */\na {}`,
			fixed: `/* horse\n\n */\na {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `/* horse\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n */\r\na {}`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481
		{
			description: `two blank lines in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n\n}\n`,
			fixed: `a {\n\tb: c;\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {\r\n\tb: c;\r\n\r\n\r\n}\r\n`,
			fixed: `a {\r\n\tb: c;\r\n\r\n}\r\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines inside an empty block`,
			code: `a {\n\n\n}\n`,
			fixed: `a {\n\n}\n`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of the closing brace of an at-rule`,
			code: `@media (x) {\n\ta {}\n\n\n}\n`,
			fixed: `@media (x) {\n\ta {}\n\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of the closing brace of a rule nested in an at-rule`,
			code: `@media (x) {\n\ta {\n\t\tb: c;\n\n\n\t}\n}\n`,
			fixed: `@media (x) {\n\ta {\n\t\tb: c;\n\n\t}\n}\n`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines in front of a stray semicolon standing in front of the closing brace, which is no node of the block and stands in the same raw as the blank lines`,
			code: `a {\n\tb: c;\n\n\n;\n}\n`,
			fixed: `a {\n\tb: c;\n\n;\n}\n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404
		{
			description: `a stylesheet holding nothing but two line breaks, which are two empty lines and not three, and of which one is taken away`,
			code: `\n\n`,
			fixed: `\n`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same stylesheet written with carriage-return line breaks`,
			code: `\r\n\r\n`,
			fixed: `\r\n`,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `the same stylesheet with a run of spaces written behind the breaks, which ends a line of its own and hides nothing`,
			code: `\n\n   `,
			fixed: `\n   `,
			line: 2,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `a stylesheet holding a line break, a run of spaces and two line breaks, whose last run is not the one the file opened with and is counted as the end of any file is`,
			code: `\n   \n\n`,
			fixed: `\n   \n`,
			line: 4,
			column: 1,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-html`,

	accept: [
		{
			description: `blank lines around an embedded stylesheet, which stand in the document rather than in it`,
			code: `<div>




<style>
/* horse */
</style>



</div>`,
		},
		{
			description: `a blank line closing an embedded stylesheet`,
			code: `<div>
<style>
/* horse */

</style>
</div>`,
		},
		{
			description: `blank lines in a style attribute and in two embedded stylesheets`,
			code: `<div style="
color: pink;

">
<style>
/* style1 */

</style>
<style>
/* style2 */

</style>
</div>`,
		},
		{
			description: `an embedded stylesheet the document never closes`,
			code: `<html><!-- when there is no end tag -->
<style>
a {color: pink;}

`,
		},
	],

	reject: [
		{
			description: `two blank lines closing an embedded stylesheet`,
			code: `<div>
<style>
/* horse */


</style>
</div>`,
			fixed: `<div>
<style>
/* horse */

</style>
</div>`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},

		{
			description: `two blank lines inside a style attribute`,
			code: `<div style="color: pink;


">
</div>`,
			fixed: `<div style="color: pink;

">
</div>`,
			line: 3,
			column: 1,
			message: messages.expected(1),
		},
		{
			description: `two blank lines closing the second of two embedded stylesheets`,
			code: `<div style="color: pink;">
<style>
a {}

</style>
<style>
a {}


</style>
</div>`,
			fixed: `<div style="color: pink;">
<style>
a {}

</style>
<style>
a {}

</style>
</div>`,
			line: 9,
			column: 1,
			message: messages.expected(1),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481
		{
			description: `two blank lines in front of the closing brace of a rule in an embedded stylesheet`,
			code: `<style>\na {\n\tb: c;\n\n\n}\n</style>\n`,
			fixed: `<style>\na {\n\tb: c;\n\n}\n</style>\n`,
			line: 5,
			column: 1,
			message: messages.expected(1),
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			description: `two rules with a single line break between them`,
			code: `a {}\nb {}`,
		},
		{
			description: `a blank line between two rules`,
			code: `a {}\n\nb {}`,
		},
		{
			description: `two blank lines between two rules`,
			code: `a {}\n\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\nb {}`,
		},
		{
			description: `two blank lines on either side of a comment`,
			code: `a {}\n\n\n/** horse */\n\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
		},
		{
			description: `a rule closed by two blank lines and a run of spaces, which is exactly the option's count`,
			code: `a {}\n\n   `,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404
		{
			description: `a stylesheet holding nothing but two line breaks, which are exactly the option's count`,
			code: `\n\n`,
		},
	],

	reject: [
		{
			description: `a rule closed by three blank lines and a run of spaces, which ends a line of its own and hides none of the three`,
			code: `a {}\n\n\n   `,
			fixed: `a {}\n\n   `,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines between two rules`,
			code: `a {}\n\n\n\nb {}`,
			fixed: `a {}\n\n\nb {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n\r\nb {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind a comment`,
			code: `a {}\n\n/** horse */\n\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\n\nb {}`,
			line: 6,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			line: 6,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines inside a comment`,
			code: `/* horse\n\n\n\n */\na {}`,
			fixed: `/* horse\n\n\n */\na {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `/* horse\r\n\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n\r\n */\r\na {}`,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/481
		{
			description: `three blank lines in front of the closing brace of a rule`,
			code: `a {\n\tb: c;\n\n\n\n}\n`,
			fixed: `a {\n\tb: c;\n\n\n}\n`,
			line: 5,
			column: 1,
			message: messages.expected(2),
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404
		{
			description: `a stylesheet holding nothing but three line breaks, which are three empty lines and not four`,
			code: `\n\n\n`,
			fixed: `\n\n`,
			line: 3,
			column: 1,
			message: messages.expected(2),
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: `comments` }],

	accept: [
		{
			description: `blank lines inside a comment, which the option lets stand`,
			code: `a {}\n\n/*\n\n\n\n*/\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/*\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
		},
		{
			description: `a longer run of blank lines inside a comment`,
			code: `a {}\n\n/**\n\n\n\n\n\n\n*/\n\nb {}`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
		},
		{
			description: `blank lines inside a comment standing in a block`,
			code: `a {\n display: block;\n /*\n\n\n\n */\n}\n\n`,
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {\r\n display: block;\r\n /*\r\n\r\n\r\n\r\n */\r\n}\r\n\r\n`,
		},
	],

	reject: [
		{
			description: `three blank lines behind a comment whose own are let stand`,
			code: `a {}\n\n/*\n\n\n\n\n*/\n\n\n\nb {}`,
			fixed: `a {}\n\n/*\n\n\n\n\n*/\n\n\nb {}`,
			line: 11,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `the same blank lines written with carriage-return line breaks`,
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\nb {}`,
			line: 11,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `blank lines closing the stylesheet with a run of spaces behind them, which this option counts as the plain one does`,
			code: `a {}\n\n\n   `,
			fixed: `a {}\n\n   `,
			line: 4,
			column: 1,
			message: messages.expected(2),
		},
	],
})
