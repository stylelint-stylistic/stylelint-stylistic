import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			code: `a {}\n`,
			description: `a rule closed by a newline, with no blank line anywhere`,
		},
	],
	reject: [
		{
			code: `\na {}`,
			fixed: `a {}`,
			description: `a blank line opening the stylesheet`,
			message: messages.expected(0),
			line: 1,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [1],

	accept: [
		{
			code: `\na {}`,
			description: `a blank line opening the stylesheet`,
		},
		{
			code: `\r\na {}`,
			description: `the same blank line written with a carriage-return line break`,
		},
		{
			code: `a {}\n`,
			description: `a rule closed by a newline`,
		},
		{
			code: `a {}\r\n`,
			description: `the same rule closed by a carriage-return line break`,
		},
		{
			code: `a {}\nb {}`,
			description: `two rules with a single line break between them`,
		},
		{
			code: `a {}\r\nb {}`,
			description: `the same written with a carriage-return line break`,
		},
		{
			code: `a {}\n\nb {}`,
			description: `a blank line between two rules`,
		},
		{
			code: `a {}\r\n\r\nb {}`,
			description: `the same blank line written with carriage-return line breaks`,
		},
		{
			code: `/** horse */\n\nb {}`,
			description: `a blank line between a comment and a rule`,
		},
		{
			code: `/** horse */\r\n\r\nb {}`,
			description: `the same blank line written with carriage-return line breaks`,
		},
		{
			code: `a {}\n\n/** horse */\n\nb {}`,
			description: `blank lines on either side of a comment standing between two rules`,
		},
		{
			code: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `\n\na {}`,
			fixed: `\na {}`,
			description: `two blank lines opening the stylesheet`,
			message: messages.expected(1),
			line: 2,
			column: 1,
		},
		{
			code: `\r\n\r\na {}`,
			fixed: `\r\na {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 2,
			column: 1,
		},
		{
			code: `a {}\n\n`,
			fixed: `a {}\n`,
			description: `two blank lines closing the stylesheet`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n`,
			fixed: `a {}\r\n`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `a {}\n\n\nb {}`,
			fixed: `a {}\n\nb {}`,
			description: `two blank lines between two rules`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `a {}\n\n/** horse */\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			description: `two blank lines behind a comment`,
			message: messages.expected(1),
			line: 5,
			column: 1,
		},
		{
			code: `a {}\n\n\n/** horse */\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\nb {}`,
			description: `two blank lines in front of a comment`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 5,
			column: 1,
		},
		{
			code: `/* horse\n\n\n */\na {}`,
			fixed: `/* horse\n\n */\na {}`,
			description: `two blank lines inside a comment`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
			code: `/* horse\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n */\r\na {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [1],
	customSyntax: `postcss-html`,

	accept: [
		{
			code: `<div>




<style>
/* horse */
</style>



</div>`,
			description: `blank lines around an embedded stylesheet, which stand in the document rather than in it`,
		},
		{
			code: `<div>
<style>
/* horse */

</style>
</div>`,
			description: `a blank line closing an embedded stylesheet`,
		},
		{
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
			description: `blank lines in a style attribute and in two embedded stylesheets`,
		},
		{
			code: `<html><!-- when there is no end tag -->
<style>
a {color: pink;}

`,
			description: `an embedded stylesheet the document never closes`,
		},
	],

	reject: [
		{
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
			description: `two blank lines closing an embedded stylesheet`,
			message: messages.expected(1),
			line: 5,
			column: 1,
		},

		{
			code: `<div style="color: pink;


">
</div>`,
			fixed: `<div style="color: pink;

">
</div>`,
			description: `two blank lines inside a style attribute`,
			message: messages.expected(1),
			line: 3,
			column: 1,
		},
		{
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
			description: `two blank lines closing the second of two embedded stylesheets`,
			message: messages.expected(1),
			line: 9,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [2],

	accept: [
		{
			code: `a {}\nb {}`,
			description: `two rules with a single line break between them`,
		},
		{
			code: `a {}\n\nb {}`,
			description: `a blank line between two rules`,
		},
		{
			code: `a {}\n\n\nb {}`,
			description: `two blank lines between two rules`,
		},
		{
			code: `a {}\r\n\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
		{
			code: `a {}\n\n\n/** horse */\n\n\nb {}`,
			description: `two blank lines on either side of a comment`,
		},
		{
			code: `a {}\r\n\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `a {}\n\n\n\nb {}`,
			fixed: `a {}\n\n\nb {}`,
			description: `three blank lines between two rules`,
			message: messages.expected(2),
			line: 4,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(2),
			line: 4,
			column: 1,
		},
		{
			code: `a {}\n\n/** horse */\n\n\n\nb {}`,
			fixed: `a {}\n\n/** horse */\n\n\nb {}`,
			description: `three blank lines behind a comment`,
			message: messages.expected(2),
			line: 6,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n/** horse */\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/** horse */\r\n\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(2),
			line: 6,
			column: 1,
		},
		{
			code: `/* horse\n\n\n\n */\na {}`,
			fixed: `/* horse\n\n\n */\na {}`,
			description: `three blank lines inside a comment`,
			message: messages.expected(2),
			line: 4,
			column: 1,
		},
		{
			code: `/* horse\r\n\r\n\r\n\r\n */\r\na {}`,
			fixed: `/* horse\r\n\r\n\r\n */\r\na {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(2),
			line: 4,
			column: 1,
		},
	],
})

testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `\n\n// one`,
			description: `two blank lines in front of an end-of-line comment`,
		},
		{
			code: `// one\n\n`,
			description: `two blank lines behind an end-of-line comment`,
		},
		{
			code: `// one\n\n\n// two\n`,
			description: `two blank lines between two end-of-line comments`,
		},
	],

	reject: [
		{
			code: `\n\n\n// one`,
			fixed: `\n\n// one`,
			description: `three blank lines in front of an end-of-line comment`,
			message: messages.expected(2),
			line: 3,
			column: 1,
		},
		{
			code: `// one\n\n\n`,
			fixed: `// one\n\n`,
			description: `three blank lines behind an end-of-line comment`,
			message: messages.expected(2),
			line: 4,
			column: 3,
		},
		{
			code: `// one\n\n\n\n// two\n`,
			fixed: `// one\n\n\n// two\n`,
			description: `three blank lines between two end-of-line comments`,
			message: messages.expected(2),
			line: 5,
			column: 2,
		},
	],
})

testRule({
	ruleName,
	config: [2, { ignore: `comments` }],

	accept: [
		{
			code: `a {}\n\n/*\n\n\n\n*/\n\nb {}`,
			description: `blank lines inside a comment, which the option lets stand`,
		},
		{
			code: `a {}\r\n\r\n/*\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
		{
			code: `a {}\n\n/**\n\n\n\n\n\n\n*/\n\nb {}`,
			description: `a longer run of blank lines inside a comment`,
		},
		{
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n\r\n\r\n*/\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
		{
			code: `a {\n display: block;\n /*\n\n\n\n */\n}\n\n`,
			description: `blank lines inside a comment standing in a block`,
		},
		{
			code: `a {\r\n display: block;\r\n /*\r\n\r\n\r\n\r\n */\r\n}\r\n\r\n`,
			description: `the same blank lines written with carriage-return line breaks`,
		},
	],

	reject: [
		{
			code: `a {}\n\n/*\n\n\n\n\n*/\n\n\n\nb {}`,
			fixed: `a {}\n\n/*\n\n\n\n\n*/\n\n\nb {}`,
			description: `three blank lines behind a comment whose own are let stand`,
			message: messages.expected(2),
			line: 11,
			column: 1,
		},
		{
			code: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\n\r\nb {}`,
			fixed: `a {}\r\n\r\n/**\r\n\r\n\r\n\r\n\r\n*/\r\n\r\n\r\nb {}`,
			description: `the same blank lines written with carriage-return line breaks`,
			message: messages.expected(2),
			line: 11,
			column: 1,
		},
	],
})
