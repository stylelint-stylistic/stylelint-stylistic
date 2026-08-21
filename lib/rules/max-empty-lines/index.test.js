import { messages, ruleName } from "./index.js"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [0],

	accept: [
		{
			description: `a rule closed by a newline, with no blank line anywhere`,
			code: `a {}\n`,
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
	],

	reject: [
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
	],
})

testRule({
	ruleName,
	config: [2],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `two blank lines in front of an end-of-line comment`,
			code: `\n\n// one`,
		},
		{
			description: `two blank lines behind an end-of-line comment`,
			code: `// one\n\n`,
		},
		{
			description: `two blank lines between two end-of-line comments`,
			code: `// one\n\n\n// two\n`,
		},
	],

	reject: [
		{
			description: `three blank lines in front of an end-of-line comment`,
			code: `\n\n\n// one`,
			fixed: `\n\n// one`,
			line: 3,
			column: 1,
			message: messages.expected(2),
		},
		{
			description: `three blank lines behind an end-of-line comment`,
			code: `// one\n\n\n`,
			fixed: `// one\n\n`,
			line: 4,
			column: 3,
			message: messages.expected(2),
		},
		{
			description: `three blank lines between two end-of-line comments`,
			code: `// one\n\n\n\n// two\n`,
			fixed: `// one\n\n\n// two\n`,
			line: 5,
			column: 2,
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
	],
})
