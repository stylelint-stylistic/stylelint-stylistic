import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName, autoStripIndent: false })

testRule({
	ruleName,
	config: [true],

	accept: [
		{
			description: `an empty stylesheet`,
			code: ``,
		},
		{
			description: `a stylesheet holding a single newline`,
			code: `\n`,
		},
		{
			description: `a rule closed by a newline`,
			code: `a { color: pink; }\n`,
		},
		{
			description: `a rule closed by a carriage-return line break`,
			code: `a { color: pink; }\r\n`,
		},
		{
			description: `a rule closed by three newlines`,
			code: `a { color: pink; }\n\n\n`,
		},
		{
			description: `a rule closed by three carriage-return line breaks`,
			code: `a { color: pink; }\r\n\r\n\r\n`,
		},
	],

	reject: [
		{
			description: `a rule with no newline behind it`,
			code: `a { color: pink; }`,
			fixed: `a { color: pink; }\n`,
			line: 1,
			column: 18,
			message: messages.rejected,
		},
		{
			description: `two rules, the last of them with no newline behind it`,
			code: `a { color: pink; }\n\n\nb{ color: orange; }`,
			fixed: `a { color: pink; }\n\n\nb{ color: orange; }\n`,
			line: 4,
			column: 19,
			message: messages.rejected,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }`,
			fixed: `a { color: pink; }\r\n\r\n\r\nb{ color: orange; }\r\n`,
			line: 4,
			column: 19,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/369
		{
			description: `two free semicolons standing behind the block that ends the stylesheet`,
			code: `a { color: pink; };;`,
			fixed: `a { color: pink; };;\n`,
			line: 1,
			column: 20,
			message: messages.rejected,
		},
		{
			description: `the same written wider, each semicolon standing in a run of spaces`,
			code: `a { color: pink; }  ;  ;  `,
			fixed: `a { color: pink; }  ;  ;  \n`,
			line: 1,
			column: 26,
			message: messages.rejected,
		},
		{
			description: `a rule closed by spaces alone, which end the file on no line break at all`,
			code: `a { color: pink; }   `,
			fixed: `a { color: pink; }   \n`,
			line: 1,
			column: 21,
			message: messages.rejected,
		},
		{
			description: `a rule closed by two line breaks with spaces behind them, which end the file on no line break at all`,
			code: `a { color: pink; }\n\n   `,
			fixed: `a { color: pink; }\n\n`,
			line: 3,
			column: 3,
			message: messages.rejected,
		},
		{
			description: `a stylesheet holding nothing but two free semicolons, the whole of which stands in the raw the fix writes into`,
			code: `;;`,
			fixed: `;;\n`,
			line: 1,
			column: 2,
			message: messages.rejected,
		},
		{
			description: `a bare carriage return inside a comment, which is whitespace and no line break, so the file is closed with a line feed`,
			code: `a { color:/*\r*/pink; }`,
			fixed: `a { color:/*\r*/pink; }\n`,
			line: 1,
			column: 22,
			message: messages.rejected,
		},
		{
			description: `a nested rule with no newline behind it`,
			code: `&.active {\n    top:\n    .tab {}\n}`,
			fixed: `&.active {\n    top:\n    .tab {}\n}\n`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		{
			description: `the same written with carriage-return line breaks`,
			code: `&.active {\r\n    top:\r\n    .tab {}\r\n}`,
			fixed: `&.active {\r\n    top:\r\n    .tab {}\r\n}\r\n`,
			line: 4,
			column: 1,
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
			description: `an embedded stylesheet closed by a newline`,
			code: `<div>
<style>
a {
  color: red;
}
</style>

</div>`,
		},
		{
			description: `a style attribute, which carries no source of its own to close`,
			code: `<a style="color: red;"></a>`,
		},
	],

	reject: [
		{
			description: `an embedded stylesheet with no newline at its end`,
			code: `<div>
<style>a {
  color: red;
}</style>

</div>`,
			line: 4,
			column: 1,
			message: messages.rejected,
		},
		// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/369
		{
			description: `an embedded stylesheet whose last block two free semicolons stand behind`,
			code: `<div>
<style>a {
  color: red;
};;</style>

</div>`,
			fixed: `<div>
<style>a {
  color: red;
};;
</style>

</div>`,
			line: 4,
			column: 3,
			message: messages.rejected,
		},
	],
})
